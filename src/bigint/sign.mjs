export * from './Types/bigint.mjs'

export const sign = {
   bigint: () => b => {
      if (b === 0n) return 0n
      if (b > 0n) return 1n
      return -1n
   }
}
