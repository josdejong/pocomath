export * from './Types/Complex.mjs'

export const add = {
   /* Relying on conversions for both complex + number and complex + bigint
    * leads to an infinite loop when adding a number and a bigint, since they
    * both convert to Complex.
    */
   'Complex,number': ({
      'self(number,number)': addNum,
      'complex(number,number)': cplx
   }) => (z,x) => cplx(addNum(z.re, x), z.im),

   'Complex,bigint': ({
      'self(bigint,bigint)': addBigInt,
      'complex(bigint,bigint)': cplx
   }) => (z,x) => cplx(addBigInt(z.re, x), z.im),

   'Complex,Complex': ({
      self,
      complex
   }) => (w,z) => complex(self(w.re, z.re), self(w.im, z.im))
}
