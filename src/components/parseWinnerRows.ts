export interface RaffleWinner {
  donationId?: string
  txHash: string
}

const findColumnIndex = (headers: unknown[], columnName: string): number =>
  headers.findIndex(
    header => typeof header === 'string' && header.trim() === columnName,
  )

// Parse the API's `data` array into a list of winners. The API returns either
// a 4-column shape `[donationId, giverAddress, valueUsdAfterGivbackFactor, txHash]`
// or, when the spreadsheet has no donationId column, the 3-column legacy shape
// `[giverAddress, valueUsdAfterGivbackFactor, txHash]`. Tolerate both.
export const parseWinnerRows = (data: unknown): RaffleWinner[] => {
  if (!Array.isArray(data) || data.length <= 1 || !Array.isArray(data[0])) {
    return []
  }

  const headers = data[0]
  const donationIdIndex = findColumnIndex(headers, 'donationId')
  const txHashIndex = findColumnIndex(headers, 'txHash')

  if (txHashIndex === -1) {
    return []
  }

  return data.slice(1, 21).flatMap(row => {
    if (!Array.isArray(row)) {
      return []
    }

    const txHash = row[txHashIndex]
    if (txHash == null || txHash === '') {
      return []
    }

    const donationIdRaw =
      donationIdIndex !== -1 ? row[donationIdIndex] : undefined
    const donationId =
      donationIdRaw != null && donationIdRaw !== ''
        ? String(donationIdRaw)
        : undefined

    return [{ donationId, txHash: String(txHash) }]
  })
}
