export const roundquotient = {
    'T,T': ({'round(T)': rnd, 'divide(T,T)':div}) => (n,d) => rnd(div(n,d))
}
