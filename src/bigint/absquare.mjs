export * from './Types/bigint.mjs'

/* Absolute value squared */
export const absquare = {
    bigint: ({'square(bigint)': sqb}) => b => sqb(b)
}
