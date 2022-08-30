import Returns from '../core/Returns.mjs'
export const mean = {
   '...T': ({
      T,
      add,
      'divide(T,NumInt)': div
   }) => Returns(T, args => div(add(...args), args.length))
}
