import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

export const isZero = {
    'T:number': () => Returns('boolean', n => n === 0)
}
