export const sign = {
   T: ({'compare(T,T)': cmp, 'zero(T)': Z}) => x => cmp(x, Z(x))
}
