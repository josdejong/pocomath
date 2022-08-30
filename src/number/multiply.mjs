import Returns from '../core/Returns.mjs'

export * from './Types/number.mjs'

export const multiply = {'T:number,T': ({T}) => Returns(T, (m,n) => m*n)}
