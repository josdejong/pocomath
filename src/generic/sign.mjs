export const sign = {
   any: ({negate, divide, abs}) => x => {
      if (x === negate(x)) return x // zero
      return divide(x, abs(x))
   }
}
