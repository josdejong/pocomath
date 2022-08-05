export {Tuple} from './Types/Tuple.mjs'

export const isZero = {
   'Tuple<T>': ({'self(T)': me}) => t => t.elts.every(e => me(e))
   // Note we can't just say `every(me)` above since every invokes its
   // callback with more arguments, which then violates typed-function's
   // signature for `me`
}
