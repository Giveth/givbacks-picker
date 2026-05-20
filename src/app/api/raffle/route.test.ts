// Route-handler test that exercises the full GET /api/raffle path —
// env -> JWT setup -> googleapis fetch -> selectRaffleWinners -> JSON response —
// against realistic mock spreadsheet data. The googleapis client is mocked
// so the test runs offline.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sampleRows,
  sampleRowsAliased,
  sampleRowsNoDonationId,
} from './__fixtures__/sampleSpreadsheet'

const sheetsGet = vi.fn()
const valuesGet = vi.fn()

vi.mock('google-auth-library', () => ({
  JWT: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('googleapis', () => ({
  google: {
    sheets: () => ({
      spreadsheets: {
        get: sheetsGet,
        values: { get: valuesGet },
      },
    }),
  },
}))

const setMockSheet = (values: string[][]) => {
  sheetsGet.mockResolvedValue({
    data: {
      sheets: [{ properties: { title: 'NewGIVbacksTestTable_2026_May' } }],
    },
  })
  valuesGet.mockResolvedValue({ data: { values } })
}

const callRoute = async () => {
  const { GET } = await import('./route')
  return GET()
}

describe('GET /api/raffle (route handler, realistic mocked sheet)', () => {
  beforeEach(() => {
    vi.resetModules()
    sheetsGet.mockReset()
    valuesGet.mockReset()
    process.env.GOOGLE_SHEET_ID = 'fake-spreadsheet-id'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'fake@example.com'
    process.env.GOOGLE_PRIVATE_KEY = 'fake-private-key'
  })

  it('returns a 200 with a donationId-headed payload from realistic data', async () => {
    setMockSheet(sampleRows)
    const res = await callRoute()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toBe('Data fetched successfully')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toEqual([
      'donationId',
      'giverAddress',
      'valueUsdAfterGivbackFactor',
      'txHash',
    ])
  })

  it('selects between 1 and 20 winners and never duplicates a giver', async () => {
    setMockSheet(sampleRows)
    const res = await callRoute()
    const { data } = await res.json()
    const winners: string[][] = data.slice(1)

    // Eligible-row count after filtering: 25 eligible, 22 unique givers
    expect(winners.length).toBeGreaterThan(0)
    expect(winners.length).toBeLessThanOrEqual(20)

    const givers = winners.map(r => r[1])
    expect(new Set(givers).size).toBe(givers.length)
  })

  it('includes a non-empty donationId, txHash, and positive value in every winner row', async () => {
    setMockSheet(sampleRows)
    const res = await callRoute()
    const { data } = await res.json()
    const winners: string[][] = data.slice(1)

    for (const row of winners) {
      const [donationId, giver, value, tx] = row
      expect(donationId).toMatch(/^\d+$/)
      expect(giver).toMatch(/^0x[0-9a-f]{40}$/i)
      expect(parseFloat(value)).toBeGreaterThan(0)
      expect(tx).toMatch(/^0x[0-9a-f]{64}$/i)
    }
  })

  it('skips ineligible rows (missing donationId / txHash / giver, zero or negative value)', async () => {
    setMockSheet(sampleRows)
    const res = await callRoute()
    const { data } = await res.json()
    const winners: string[][] = data.slice(1)

    // The 5 ineligible donation IDs in the fixture must never be picked.
    const skippedDonationIds = new Set(['', '10027', '10028', '10029', '10030'])
    for (const row of winners) {
      expect(skippedDonationIds.has(row[0])).toBe(false)
    }
  })

  it('accepts fromWalletAddress / transactionId column aliases', async () => {
    setMockSheet(sampleRowsAliased)
    const res = await callRoute()
    expect(res.status).toBe(200)

    const { data } = await res.json()
    expect(data[0][0]).toBe('donationId')
    expect(data.length).toBeGreaterThan(1)
    for (const row of data.slice(1)) {
      expect(row[0]).toMatch(/^2000\d$/)
      expect(row[3]).toMatch(/^0x[0-9a-f]+$/i)
    }
  })

  it('returns 500 with "Required columns not found in the spreadsheet" when donationId column is absent', async () => {
    setMockSheet(sampleRowsNoDonationId)
    const res = await callRoute()
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe('Required columns not found in the spreadsheet')
  })

  it('returns 500 when the spreadsheet is empty', async () => {
    setMockSheet([])
    const res = await callRoute()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('No data found in the spreadsheet.')
  })
})
