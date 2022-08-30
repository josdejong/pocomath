import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

// Might be nice to have type aliases!
export const quaternion = {
    'T,T,T,T': ({
        T,
        'complex(T,T)': cplxT,
        'complex(Complex<T>,Complex<T>)': quat
    }) => Returns(
        `Complex<Complex<${T}>>`,
        (r,i,j,k) => quat(cplxT(r,j), cplxT(i,k))
    )
}
