import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const zero = {bigint: () => Returns('bigint', () => 0n)}
