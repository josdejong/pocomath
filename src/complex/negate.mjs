export {Types} from './Types/Complex.mjs'

export const negate = {
   Complex: [['self'], ref => z => {
      return {re: ref.self(z.re), im: ref.self(z.im)}
   }]
}
