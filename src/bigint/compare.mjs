export * from './Types/bigint.mjs'

export const compare = {
   'bigint,bigint': () => (a,b) => a === b ? 0n : (a > b ? 1n : -1n)
}
