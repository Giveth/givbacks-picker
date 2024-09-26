import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

type SpreadsheetRow = string[];

interface WeightedDonation {
  giverAddress: string;
  txHash: string;
  value: number;
  rowIndex: number;
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

    console.log(`Data fetched successfully. Row count: ${rows.length}`);
    console.log('Headers:', rows[0]);
    console.log('First 10 rows:', rows.slice(1, 10));

    return rows;
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
}

function selectRaffleWinners(data: any) {
  const headers = data[0];
  const giverAddressIndex = headers.indexOf('giverAddress');
  const valueIndex = headers.indexOf('valueUsdAfterGivbackFactor');
  const txHashIndex = headers.indexOf('txHash');

  if (giverAddressIndex === -1 || valueIndex === -1 || txHashIndex === -1) {
    throw new Error('Required columns not found in the spreadsheet');
  }

  const eligibleDonations: WeightedDonation[] = data.slice(1)
    .map((row: any, index: any) => ({
      giverAddress: row[giverAddressIndex],
      txHash: row[txHashIndex],
      value: parseFloat(row[valueIndex]),
      rowIndex: index + 1
    }))
    .filter((donation: any) => donation.txHash && !isNaN(donation.value));

  const totalWeight = eligibleDonations.reduce((sum, donation) => sum + donation.value, 0);
  const winnerDetails: SpreadsheetRow[] = [];
  const selectedGivers = new Set<string>();

  while (winnerDetails.length < 10 && selectedGivers.size < eligibleDonations.length) {
    const randomValue = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    
    for (let donation of eligibleDonations) {
      accumulatedWeight += donation.value;
      if (accumulatedWeight >= randomValue && !selectedGivers.has(donation.giverAddress)) {
        selectedGivers.add(donation.giverAddress);
        const rowData = data[donation.rowIndex];
        winnerDetails.push([
          rowData[giverAddressIndex],
          rowData[valueIndex],
          rowData[txHashIndex]
        ]);
        break;
      }
    }
  }

  return [['giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'], ...winnerDetails];
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

export async function POST() {
  return GET();
}