import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const isZero = {
   'Complex<T>': ({'self(T)': me}) => Returns(
      'boolean', z => me(z.re) && me(z.im))
}
