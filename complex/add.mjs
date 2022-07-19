import './Complex.mjs'

export const add = {
   '...Complex': [[], addends => {
      const sum = {re: 0, im: 0}
      addends.forEach(addend => {
         sum.re += addend.re
         sum.im += addend.im
      })
      return sum
   }]
}
