import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

/* Absolute value squared */
export const absquare = {
    bigint: ({'square(bigint)': sqb}) => Returns('bigint', b => sqb(b))
}
