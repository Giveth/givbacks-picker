// Demo: feed the realistic spreadsheet fixture through the actual
// selectRaffleWinners code and print the JSON the API would return.
// Run with: node scripts/demo-local-output.mjs
//
// This exercises src/app/api/raffle/selection.ts directly so it works
// without Google credentials and without spinning up Next.js.

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Use ts-node ESM loader so we can import the .ts source directly.
register('ts-node/esm', pathToFileURL('./'))

const { selectRaffleWinners } = await import('../src/app/api/raffle/selection.ts')
const { sampleRows } = await import('../src/app/api/raffle/__fixtures__/sampleSpreadsheet.ts')

const out = selectRaffleWinners(sampleRows)

const response = { message: 'Data fetched successfully', data: out }
console.log(JSON.stringify(response, null, 2))

console.log('\n--- summary ---')
console.log('header row:', out[0])
console.log('winners:   ', out.length - 1)
const givers = out.slice(1).map(r => r[1])
console.log('unique givers:', new Set(givers).size, '/', givers.length)
const minVal = Math.min(...out.slice(1).map(r => parseFloat(r[2])))
const maxVal = Math.max(...out.slice(1).map(r => parseFloat(r[2])))
console.log('value range (USD): ', minVal, '-', maxVal)
console.log('all rows have donationId:', out.slice(1).every(r => r[0] && /^\d+$/.test(r[0])))
console.log('all rows have valid txHash:', out.slice(1).every(r => /^0x[0-9a-f]+$/i.test(r[3])))
