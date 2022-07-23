export const subtract = {
   'any,any': ({add, negate}) => (x,y) => add(x, negate(y))
}
