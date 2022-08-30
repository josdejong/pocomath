import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const isZero = {bigint: () => Returns('boolean', b => b === 0n)}
