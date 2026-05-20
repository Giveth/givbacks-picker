// Realistic sample data shaped like the production GIVbacks spreadsheet
// pulled by route.ts -> getSpreadsheetData(). 30 donations across 22 unique
// giver addresses, with a few intentional duplicates so the
// one-winner-per-giver rule actually gets exercised.

export type Row = string[]

const txHash = (n: number) =>
  '0x' + n.toString(16).padStart(2, '0').repeat(32)
const addr = (n: number) =>
  '0x' + n.toString(16).padStart(2, '0').repeat(20)

export const sampleHeaders: Row = [
  'donationId',
  'giverAddress',
  'valueUsdAfterGivbackFactor',
  'txHash',
]

export const sampleRows: Row[] = [
  [sampleHeaders[0], sampleHeaders[1], sampleHeaders[2], sampleHeaders[3]],
  ['10001', addr(1), '9900',       txHash(1)],
  ['10002', addr(2), '50.5357',    txHash(2)],
  ['10003', addr(3), '4.59616',    txHash(3)],
  ['10004', addr(4), '259.196996', txHash(4)],
  ['10005', addr(5), '72.052266',  txHash(5)],
  ['10006', addr(6), '11.279295',  txHash(6)],
  ['10007', addr(7), '4',          txHash(7)],
  ['10008', addr(8), '14.394056',  txHash(8)],
  ['10009', addr(9), '0.410399',   txHash(9)],
  ['10010', addr(10), '15.0341',   txHash(10)],
  ['10011', addr(11), '19.626783', txHash(11)],
  ['10012', addr(12), '34.087193', txHash(12)],
  ['10013', addr(13), '8.743130',  txHash(13)],
  ['10014', addr(14), '3.580600',  txHash(14)],
  ['10015', addr(15), '39.2',      txHash(15)],
  ['10016', addr(16), '6',         txHash(16)],
  ['10017', addr(17), '21.300472', txHash(17)],
  ['10018', addr(18), '3.7996',    txHash(18)],
  ['10019', addr(19), '17.848458', txHash(19)],
  ['10020', addr(20), '0.802622',  txHash(20)],
  ['10021', addr(21), '125.5',     txHash(21)],
  ['10022', addr(22), '7.42',      txHash(22)],
  // Repeated givers — each unique address can win at most once
  ['10023', addr(1),  '40',        txHash(23)],
  ['10024', addr(2),  '12.5',      txHash(24)],
  ['10025', addr(5),  '8',         txHash(25)],
  // Rows that must be skipped by selection logic
  ['',      addr(23), '500',       txHash(26)],   // missing donationId
  ['10027', addr(24), '500',       ''],            // missing txHash
  ['10028', '',       '500',       txHash(28)],   // missing giverAddress
  ['10029', addr(25), '0',         txHash(29)],   // value <= 0
  ['10030', addr(26), '-5',        txHash(30)],   // negative value
]

// Same data with the column aliases that PR#1 added
export const sampleRowsAliased: Row[] = [
  ['donationId', 'fromWalletAddress', 'valueUsdAfterGivbackFactor', 'transactionId'],
  ['20001', addr(1),  '100', txHash(1)],
  ['20002', addr(2),  '50',  txHash(2)],
  ['20003', addr(3),  '25',  txHash(3)],
  ['20004', addr(4),  '10',  txHash(4)],
]

// Data that is missing the donationId column — to verify the new code throws
// the "Required columns not found in the spreadsheet" error.
export const sampleRowsNoDonationId: Row[] = [
  ['giverAddress', 'valueUsdAfterGivbackFactor', 'txHash'],
  [addr(1), '100', txHash(1)],
  [addr(2), '50',  txHash(2)],
]
