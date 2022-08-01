export const divide = {
   'T,T': ({
      'multiply(T,T)': multT,
      'invert(T)': invT
   }) => (x, y) => multT(x, invT(y))
}

