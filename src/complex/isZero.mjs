export * from './Types/Complex.mjs'

export const isZero = {
   Complex: ({self}) => z => self(z.re) && self(z.im)
}
