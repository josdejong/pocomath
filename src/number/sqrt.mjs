import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

export const sqrt = {
   number: ({
      config,
      'complex(number,number)': cplx,
      'negate(number)': neg}) => {
         if (config.predictable || !cplx) {
            return Returns('number', n => isNaN(n) ? NaN : Math.sqrt(n))
         }
         return Returns('number|Complex<number>', n => {
            if (isNaN(n)) return NaN
            if (n >= 0) return Math.sqrt(n)
            return cplx(0, Math.sqrt(neg(n)))
         })
      }
}
