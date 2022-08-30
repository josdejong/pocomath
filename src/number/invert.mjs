import Returns from '../core/Returns.mjs'

export * from './Types/number.mjs'

export const invert = {number: () => Returns('number', n => 1/n)}
