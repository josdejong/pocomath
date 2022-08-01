export * from './Types/Complex.mjs'

export const equal = {
   'Complex,number': ({
      'isZero(number)': isZ,
      'self(number,number)': eqNum
   }) => (z, x) => eqNum(z.re, x) && isZ(z.im),

   'Complex,bigint': ({
      'isZero(bigint)': isZ,
      'self(bigint,bigint)': eqBigInt
   }) => (z, b) => eqBigInt(z.re, b) && isZ(z.im),

   'Complex,Complex': ({self}) => (w,z) => self(w.re, z.re) && self(w.im, z.im),

   'GaussianInteger,GaussianInteger': ({
      'self(bigint,bigint)': eq
   }) => (a,b) => eq(a.re, b.re) && eq(a.im, b.im)
}
