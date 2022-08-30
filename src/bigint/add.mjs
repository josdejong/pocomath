import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const add = {'bigint,bigint': () => Returns('bigint', (a,b) => a+b)}
