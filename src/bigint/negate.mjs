import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const negate = {bigint: () => Returns('bigint', b => -b)}
