export * from './Types/Complex.mjs'

export const abs = {
    'Complex<T>': ({
        'sqrt(T)': sqt,
        'absquare(Complex<T>)': absq
    }) => z => sqt(absq(z))
}
