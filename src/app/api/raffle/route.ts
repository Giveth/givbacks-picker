import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

type SpreadsheetRow = string[];

interface EligibleDonation {
  index: number;
  weight: number;
}

interface SelectedDonation {
  donationId: string;
  giverAddress: string;
  txHash: string;
  value: string;
}

const findHeaderIndex = (
  headers: SpreadsheetRow,
  acceptedNames: string[],
): number => {
  return headers.findIndex(header =>
    acceptedNames.includes(header.trim()),
  );
}

async function getSpreadsheetData() {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY 
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('Fetching spreadsheet metadata...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];
    console.log('Available sheet names:', sheetNames);

    const sheetName = sheetNames.find(name => name?.includes('NewGIVbacksTestTable')) || sheetNames[0];

    if (!sheetName) {
      throw new Error('No valid sheet found in the spreadsheet');
    }

    console.log('Using sheet name:', sheetName);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the spreadsheet.');
    }

    return rows;
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
}

function selectRaffleWinners(data: SpreadsheetRow[]) {
  const headers = data[0];
  const donationIdIndex = findHeaderIndex(headers, ['donationId']);
  const giverAddressIndex = findHeaderIndex(headers, [
    'giverAddress',
    'fromWalletAddress',
  ]);
  const valueIndex = findHeaderIndex(headers, ['valueUsdAfterGivbackFactor']);
  const txHashIndex = findHeaderIndex(headers, ['txHash', 'transactionId']);

  if (
    donationIdIndex === -1 ||
    giverAddressIndex === -1 ||
    valueIndex === -1 ||
    txHashIndex === -1
  ) {
    throw new Error('Required columns not found in the spreadsheet');
  }

  // Calculate total weight and identify eligible donations in a single pass
  const eligibleDonations: EligibleDonation[] = [];
  const uniqueGivers = new Set<string>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const donationId = row[donationIdIndex];
    const giverAddress = row[giverAddressIndex];
    const txHash = row[txHashIndex];
    const value = parseFloat(row[valueIndex]);

    if (donationId && txHash && giverAddress && !isNaN(value) && value > 0) {
      const weight = Math.pow(value, 1);
      eligibleDonations.push({ index: i, weight });
      uniqueGivers.add(giverAddress);
    }
  }

  if (eligibleDonations.length === 0) {
    throw new Error('No eligible donations found');
  }

  const totalWeight = eligibleDonations.reduce((sum, donation) => sum + donation.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('No eligible donations with positive weight found');
  }

  eligibleDonations.forEach(donation => {
    donation.weight /= totalWeight; // Normalize each weight to sum to 1
  });

  const maxWinners = Math.min(20, uniqueGivers.size);
  const winnerDetails: SpreadsheetRow[] = [];
  const selectedGivers = new Set<string>();

  while (winnerDetails.length < maxWinners) {
    let selectedDonation: SelectedDonation | null = null;

    const availableDonations = eligibleDonations.filter(donation => {
      const row = data[donation.index];
      const giverAddress = row[giverAddressIndex];

      return !selectedGivers.has(giverAddress);
    });

    if (availableDonations.length === 0) {
      break;
    }

    const availableWeight = availableDonations.reduce(
      (sum, donation) => sum + donation.weight,
      0,
    );

    if (availableWeight <= 0) {
      break;
    }

    const randomWeight = Math.random() * availableWeight;
    let cumulativeWeight = 0;
    const selectedWeightedDonation =
      availableDonations.find(donation => {
        cumulativeWeight += donation.weight;
        return cumulativeWeight >= randomWeight;
      }) ?? availableDonations[availableDonations.length - 1];

    if (selectedWeightedDonation) {
      const row = data[selectedWeightedDonation.index];
      selectedDonation = {
        donationId: row[donationIdIndex],
        giverAddress: row[giverAddressIndex],
        value: row[valueIndex].toString(),
        txHash: row[txHashIndex]
      };
    }

    if (selectedDonation) {
      selectedGivers.add(selectedDonation.giverAddress);
      winnerDetails.push([
        selectedDonation.donationId,
        selectedDonation.giverAddress,
        selectedDonation.value,
        selectedDonation.txHash
      ]);
    }

    // Break if all unique givers have been selected
    if (selectedGivers.size >= uniqueGivers.size) {
      break;
    }
  }

  return [
    ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
    ...winnerDetails,
  ];
}

export async function GET() {
  try {
    const data = await getSpreadsheetData();
    const winners = selectRaffleWinners(data);
    return NextResponse.json({ message: 'Data fetched successfully', data: winners }, { status: 200 });
  } catch (error) {
    console.error('Error in GET request:', error);
    let errorMessage = 'Failed to fetch data';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function POST() {
  return GET();
}