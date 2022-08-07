export * from './Types/number.mjs'

export const isZero = {
    number: () => n => n === 0,
    NumInt: () => n => n === 0  // necessary because of generic template
}
