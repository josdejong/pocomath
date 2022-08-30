import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

export const add = {
    // Note the below assumes that all subtypes of number that will be defined
    // are closed under addition!
    'T:number, T': ({T}) => Returns(T, (m,n) => m+n)
}
