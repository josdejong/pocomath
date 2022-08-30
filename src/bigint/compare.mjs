import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const compare = {
   'bigint,bigint': () => Returns(
      'boolean', (a,b) => a === b ? 0n : (a > b ? 1n : -1n))
}
