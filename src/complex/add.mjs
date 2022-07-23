export {Types} from './Types/Complex.mjs'

export const add = {
   '...Complex': {
      uses: ['self'],
      does: ref => addends => {
         if (addends.length === 0) return {re:0, im:0}
         const seed = addends.shift()
         return addends.reduce((w,z) =>
            ({re: ref.self(w.re, z.re), im: ref.self(w.im, z.im)}), seed)
      }
   }
}
