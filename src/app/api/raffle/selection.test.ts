import { describe, it, expect } from 'vitest'
import { selectRaffleWinners } from './selection'

describe('selectRaffleWinners', () => {
  it('returns header row containing donationId as first column', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['d1', '0xa', '100', '0xtx1'],
    ]
    const out = selectRaffleWinners(data)
    expect(out[0]).toEqual([
      'donationId',
      'giverAddress',
      'valueUsdAfterGivbackFactor',
      'txHash',
    ])
  })

  it('includes donationId in every winner row', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['d1', '0xa', '100', '0xtx1'],
      ['d2', '0xb', '50', '0xtx2'],
      ['d3', '0xc', '25', '0xtx3'],
    ]
    const winners = selectRaffleWinners(data).slice(1)
    expect(winners.length).toBe(3)
    expect(winners.every(r => r.length === 4)).toBe(true)
    expect(winners.every(r => r[0].startsWith('d'))).toBe(true)
  })

  it('accepts fromWalletAddress and transactionId as column aliases', () => {
    const data = [
      ['donationId', 'fromWalletAddress', 'valueUsdAfterGivbackFactor', 'transactionId'],
      ['d1', '0xa', '100', '0xtx1'],
      ['d2', '0xb', '50', '0xtx2'],
    ]
    const out = selectRaffleWinners(data)
    expect(out[0][0]).toBe('donationId')
    expect(out.length).toBe(3)
    expect(out[1][3]).toMatch(/^0xtx/)
  })

  it('trims whitespace in header names', () => {
    const data = [
      ['donationId ', ' giverAddress', ' valueUsdAfterGivbackFactor ', '  txHash'],
      ['d1', '0xa', '10', '0xtx1'],
    ]
    const out = selectRaffleWinners(data)
    expect(out.length).toBe(2)
    expect(out[1][0]).toBe('d1')
  })

  it('throws "Required columns not found in the spreadsheet" when donationId is missing', () => {
    const data = [
      ['giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['0xa', '100', '0xtx1'],
    ]
    expect(() => selectRaffleWinners(data)).toThrowError(
      'Required columns not found in the spreadsheet',
    )
  })

  it('throws when no eligible donations remain', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['', '0xa', '100', '0xtx1'],
      ['d2', '', '50', '0xtx2'],
      ['d3', '0xc', '0', '0xtx3'],
    ]
    expect(() => selectRaffleWinners(data)).toThrowError(
      'No eligible donations found',
    )
  })

  it('skips rows missing donationId, txHash, or giver, and rows with non-positive value', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['', '0xa', '100', '0xtx1'],
      ['d2', '0xb', '50', ''],
      ['d3', '', '50', '0xtx3'],
      ['d4', '0xd', '0', '0xtx4'],
      ['d5', '0xe', '-5', '0xtx5'],
      ['d6', '0xf', '20', '0xtx6'],
    ]
    const out = selectRaffleWinners(data)
    expect(out.length).toBe(2)
    expect(out[1][0]).toBe('d6')
  })

  it('returns at most one winner per unique giver address', () => {
    const data = [
      ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
      ['d1', '0xa', '100', '0xtx1'],
      ['d2', '0xa', '90', '0xtx2'],
      ['d3', '0xa', '80', '0xtx3'],
      ['d4', '0xb', '70', '0xtx4'],
    ]
    const winners = selectRaffleWinners(data).slice(1)
    const givers = winners.map(r => r[1])
    expect(new Set(givers).size).toBe(givers.length)
    expect(winners.length).toBe(2)
  })

  it('caps the winner count at 20 even with many unique givers', () => {
    const headers = ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash']
    const rows: string[][] = [headers]
    for (let i = 0; i < 30; i++) {
      rows.push([`d${i}`, `0x${i.toString(16).padStart(40, '0')}`, '10', `0xtx${i}`])
    }
    const winners = selectRaffleWinners(rows).slice(1)
    expect(winners.length).toBe(20)
  })
})
