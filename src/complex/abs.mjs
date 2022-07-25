export * from './Types/Complex.mjs'

export const abs = {Complex: ({sqrt, add, multiply}) => z => {
    return sqrt(add(multiply(z.re, z.re), multiply(z.im, z.im)))
}}
