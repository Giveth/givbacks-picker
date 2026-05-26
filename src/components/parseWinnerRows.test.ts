import { describe, it, expect } from 'vitest'
import { parseWinnerRows } from './parseWinnerRows'

describe('parseWinnerRows', () => {
  it('parses the 4-column shape (with donationId)', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['10001', '0xa', '100', '0xtx1'],
      ['10002', '0xb', '50', '0xtx2'],
    ]
    const winners = parseWinnerRows(data)
    expect(winners).toEqual([
      { donationId: '10001', txHash: '0xtx1' },
      { donationId: '10002', txHash: '0xtx2' },
    ])
  })

  it('parses the 3-column legacy shape (without donationId)', () => {
    const data = [
      ['giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['0xa', '100', '0xtx1'],
      ['0xb', '50', '0xtx2'],
    ]
    const winners = parseWinnerRows(data)
    expect(winners).toEqual([
      { donationId: undefined, txHash: '0xtx1' },
      { donationId: undefined, txHash: '0xtx2' },
    ])
  })

  it('returns [] when txHash column is missing', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor'],
      ['10001', '0xa', '100'],
    ]
    expect(parseWinnerRows(data)).toEqual([])
  })

  it('returns [] for empty / malformed input', () => {
    expect(parseWinnerRows(null)).toEqual([])
    expect(parseWinnerRows(undefined)).toEqual([])
    expect(parseWinnerRows([])).toEqual([])
    expect(parseWinnerRows([['donationId', 'txHash']])).toEqual([])
    expect(parseWinnerRows('not-an-array')).toEqual([])
  })

  it('drops rows with missing txHash', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['10001', '0xa', '100', '0xtx1'],
      ['10002', '0xb', '50', ''],
      ['10003', '0xc', '25', null],
    ]
    const winners = parseWinnerRows(data)
    expect(winners.length).toBe(1)
    expect(winners[0].txHash).toBe('0xtx1')
  })

  it('treats empty donationId cells as absent rather than dropping the row', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['', '0xa', '100', '0xtx1'],
    ]
    const winners = parseWinnerRows(data)
    expect(winners).toEqual([{ donationId: undefined, txHash: '0xtx1' }])
  })

  it('caps the parsed winners at 20', () => {
    const data: unknown[] = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
    ]
    for (let i = 0; i < 30; i++) {
      data.push([`d${i}`, `0x${i}`, '10', `0xtx${i}`])
    }
    expect(parseWinnerRows(data).length).toBe(20)
  })

  it('tolerates header names with whitespace', () => {
    const data = [
      [' donationId', '  giverAddress  ', 'valueUsdAfterGivbackFactor', 'txHash '],
      ['10001', '0xa', '100', '0xtx1'],
    ]
    const winners = parseWinnerRows(data)
    expect(winners).toEqual([{ donationId: '10001', txHash: '0xtx1' }])
  })
})
