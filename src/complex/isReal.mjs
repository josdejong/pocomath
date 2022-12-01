import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const isReal = {
   'Complex<T>': ({'equal(T,T)': eq, 'add(T,T)': plus}) => Returns(
      'boolean', z => eq(z.re, plus(z.re, z.im)))
}
