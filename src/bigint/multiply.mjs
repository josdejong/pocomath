import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const multiply = {'bigint,bigint': () => Returns('bigint', (a,b) => a*b)}
