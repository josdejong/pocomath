export * from './Types/Complex.mjs'

export const negate = {
   Complex: ({self}) => z => ({re: self(z.re), im: self(z.im)})
}
