export type SpreadsheetRow = string[]

interface EligibleDonation {
  index: number
  weight: number
}

interface SelectedDonation {
  donationId: string
  giverAddress: string
  txHash: string
  value: string
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

  if (
    donationIdIndex === -1 ||
    giverAddressIndex === -1 ||
    valueIndex === -1 ||
    txHashIndex === -1
  ) {
    throw new Error('Required columns not found in the spreadsheet')
  }

  const eligibleDonations: EligibleDonation[] = []
  const uniqueGivers = new Set<string>()

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const donationId = row[donationIdIndex]
    const giverAddress = row[giverAddressIndex]
    const txHash = row[txHashIndex]
    const value = parseFloat(row[valueIndex])

    if (donationId && txHash && giverAddress && !isNaN(value) && value > 0) {
      const weight = Math.pow(value, 1)
      eligibleDonations.push({ index: i, weight })
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
    let selectedDonation: SelectedDonation | null = null

    const availableDonations = eligibleDonations.filter(donation => {
      const row = data[donation.index]
      const giverAddress = row[giverAddressIndex]
      return !selectedGivers.has(giverAddress)
    })

    if (availableDonations.length === 0) {
      break
    }

    const availableWeight = availableDonations.reduce(
      (sum, donation) => sum + donation.weight,
      0,
    )

    if (availableWeight <= 0) {
      break
    }

    const randomWeight = Math.random() * availableWeight
    let cumulativeWeight = 0
    const selectedWeightedDonation =
      availableDonations.find(donation => {
        cumulativeWeight += donation.weight
        return cumulativeWeight >= randomWeight
      }) ?? availableDonations[availableDonations.length - 1]

    if (selectedWeightedDonation) {
      const row = data[selectedWeightedDonation.index]
      selectedDonation = {
        donationId: row[donationIdIndex],
        giverAddress: row[giverAddressIndex],
        value: row[valueIndex].toString(),
        txHash: row[txHashIndex],
      }
    }

    if (selectedDonation) {
      selectedGivers.add(selectedDonation.giverAddress)
      winnerDetails.push([
        selectedDonation.donationId,
        selectedDonation.giverAddress,
        selectedDonation.value,
        selectedDonation.txHash,
      ])
    }

    if (selectedGivers.size >= uniqueGivers.size) {
      break
    }
  }

  return [
    ['donationId', 'giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
    ...winnerDetails,
  ]
}
