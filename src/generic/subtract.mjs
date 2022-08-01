export const subtract = {
   'T,T': ({'add(T,T)': addT, 'negate(T)': negT}) => (x,y) => addT(x, negT(y))
}
