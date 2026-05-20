import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { selectRaffleWinners } from './selection';

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
