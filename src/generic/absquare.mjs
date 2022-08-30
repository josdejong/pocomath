import Returns from '../core/Returns.mjs'

export const absquare = {
   T: ({
      T,
      'square(T)': sq,
      'abs(T)': abval
   }) => Returns(T, t => sq(abval(t)))
}
