export {Types} from './Types/Complex.mjs'

export const add = {
   '...Complex': ({self}) => addends => {
      if (addends.length === 0) return {re:0, im:0}
      const seed = addends.shift()
      return addends.reduce(
         (w,z) => ({re: self(w.re, z.re), im: self(w.im, z.im)}), seed)
   }
}
