import Returns from '../core/Returns.mjs'

export const quotient = {
    'T,T': ({
        T,
        'floor(T)': flr,
        'divide(T,T)': div
    }) => Returns(T, (n,d) => flr(div(n,d)))
}
