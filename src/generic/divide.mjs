export const divide = {
   'any,any': ({multiply, invert}) => (x, y) => multiply(x, invert(y))
}

