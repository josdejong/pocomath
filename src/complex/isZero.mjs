export * from './Types/Complex.mjs'

export const isZero = {
   'Complex<T>': ({'self(T)': me}) => z => me(z.re) && me(z.im)
}
