export const quotient = {
    'T,T': ({'floor(T)': flr, 'divide(T,T)':div}) => (n,d) => flr(div(n,d))
}
