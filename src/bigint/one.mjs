import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const one = {bigint: () => Returns('bigint', () => 1n)}
