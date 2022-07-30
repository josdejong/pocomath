export * from './Types/Complex.mjs'

export const abs = {
    Complex: ({sqrt, 'absquare(Complex)': absq}) => z => sqrt(absq(z))
}
