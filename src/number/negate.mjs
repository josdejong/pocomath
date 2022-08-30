import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

export const negate = {
   'T:number': ({T}) => Returns(T, n => -n)
}
