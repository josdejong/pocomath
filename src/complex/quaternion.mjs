export * from './Types/Complex.mjs'

export const quaternion = {
    'T,T,T,T': ({complex}) => (r,i,j,k) => complex(complex(r,j), complex(i,k))
}
