export * from './Types/Complex.mjs'

export const absquare = {
   'Complex<T>': ({
      'add(T,T)': plus,
      'square(T)': sqr
   }) => z => plus(sqr(z.re), sqr(z.im))
}
