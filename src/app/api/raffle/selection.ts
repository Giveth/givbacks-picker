export type SpreadsheetRow = string[]

interface EligibleDonation {
  index: number
  weight: number
}

const findHeaderIndex = (
  headers: SpreadsheetRow,
  acceptedNames: string[],
): number => {
  return headers.findIndex(header => acceptedNames.includes(header.trim()))
}

export function selectRaffleWinners(data: SpreadsheetRow[]): SpreadsheetRow[] {
  if (!data || data.length === 0 || !data[0]) {
    throw new Error('Required columns not found in the spreadsheet')
  }

  const headers = data[0]
  const donationIdIndex = findHeaderIndex(headers, ['donationId'])
  const giverAddressIndex = findHeaderIndex(headers, [
    'giverAddress',
    'fromWalletAddress',
  ])
  const valueIndex = findHeaderIndex(headers, ['valueUsdAfterGivbackFactor'])
  const txHashIndex = findHeaderIndex(headers, ['txHash', 'transactionId'])

  // donationId is optional so the picker keeps working on legacy sheets
  // that haven't been migrated yet. The other three are still required.
  if (giverAddressIndex === -1 || valueIndex === -1 || txHashIndex === -1) {
    throw new Error('Required columns not found in the spreadsheet')
  }

  const hasDonationId = donationIdIndex !== -1

  const eligibleDonations: EligibleDonation[] = []
  const uniqueGivers = new Set<string>()

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const giverAddress = row[giverAddressIndex]
    const txHash = row[txHashIndex]
    const value = parseFloat(row[valueIndex])
    const donationIdOk = !hasDonationId || !!row[donationIdIndex]

    if (donationIdOk && txHash && giverAddress && !isNaN(value) && value > 0) {
      eligibleDonations.push({ index: i, weight: Math.pow(value, 1) })
      uniqueGivers.add(giverAddress)
    }
  }

  if (eligibleDonations.length === 0) {
    throw new Error('No eligible donations found')
  }

  const totalWeight = eligibleDonations.reduce(
    (sum, donation) => sum + donation.weight,
    0,
  )
  if (totalWeight <= 0) {
    throw new Error('No eligible donations with positive weight found')
  }

  eligibleDonations.forEach(donation => {
    donation.weight /= totalWeight
  })

  const maxWinners = Math.min(20, uniqueGivers.size)
  const winnerDetails: SpreadsheetRow[] = []
  const selectedGivers = new Set<string>()

  while (winnerDetails.length < maxWinners) {
    const availableDonations = eligibleDonations.filter(donation => {
      const giverAddress = data[donation.index][giverAddressIndex]
      return !selectedGivers.has(giverAddress)
    })

    if (availableDonations.length === 0) break

    const availableWeight = availableDonations.reduce(
      (sum, donation) => sum + donation.weight,
      0,
    )
    if (availableWeight <= 0) break

    const randomWeight = Math.random() * availableWeight
    let cumulativeWeight = 0
    const picked =
      availableDonations.find(donation => {
        cumulativeWeight += donation.weight
        return cumulativeWeight >= randomWeight
      }) ?? availableDonations[availableDonations.length - 1]

    const row = data[picked.index]
    const giverAddress = row[giverAddressIndex]
    const value = row[valueIndex].toString()
    const txHash = row[txHashIndex]

    selectedGivers.add(giverAddress)
    winnerDetails.push(
      hasDonationId
        ? [row[donationIdIndex], giverAddress, value, txHash]
        : [giverAddress, value, txHash],
    )

    if (selectedGivers.size >= uniqueGivers.size) break
  }

  const headerRow = hasDonationId
    ? ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash']
    : ['giverAddress', 'valueUsdAfterGivbackFactor', 'txHash']

  return [headerRow, ...winnerDetails]
}
