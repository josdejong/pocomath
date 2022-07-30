export * from './Types/Complex.mjs'

export const conjugate = {
   Complex: ({negate, complex}) => z => complex(z.re, negate(z.im))
}

