import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

export const abs = {'T:number': ({T}) => Returns(T, n => Math.abs(n))}
