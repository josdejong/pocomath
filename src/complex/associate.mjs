export * from './Types/Complex.mjs'

/* Returns true if w is z multiplied by a complex unit */
export const associate = {
    'Complex,Complex': ({
        'multiply(Complex,Complex)': times,
        'equalTT(Complex,Complex)': eq,
        zero,
        one,
        complex,
        'negate(Complex)': neg
    }) => (w,z) => {
        if (eq(w,z) || eq(w,neg(z))) return true
        const ti = times(z, complex(zero(z.re), one(z.im)))
        return eq(w,ti) || eq(w,neg(ti))
    }
}
