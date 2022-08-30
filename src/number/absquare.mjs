import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

/* Absolute value squared */
export const absquare = {
    'T:number': ({T, 'square(T)': sqn}) => Returns(T, n => sqn(n))
}
