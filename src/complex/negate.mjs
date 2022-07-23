export {Types} from './Types/Complex.mjs'

export const negate = {
   Complex: {
      uses: ['self'],
      does: ref => z => {
         return {re: ref.self(z.re), im: ref.self(z.im)}
      }
   }
}
