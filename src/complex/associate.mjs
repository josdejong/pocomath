export * from './Types/Complex.mjs'

/* Returns true if w is z multiplied by a complex unit */
export const associate = {
    'Complex<T>,Complex<T>': ({
        'multiply(Complex<T>,Complex<T>)': times,
        'equalTT(Complex<T>,Complex<T>)': eq,
        'zero(T)': zr,
        'one(T)': uno,
        'complex(T,T)': cplx,
        'negate(Complex<T>)': neg
    }) => (w,z) => {
        if (eq(w,z) || eq(w,neg(z))) return true
        const ti = times(z, cplx(zr(z.re), uno(z.im)))
        return eq(w,ti) || eq(w,neg(ti))
    }
}
