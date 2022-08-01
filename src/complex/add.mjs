export * from './Types/Complex.mjs'

export const add = {
   /* Relying on conversions for both complex + number and complex + bigint
    * leads to an infinite loop when adding a number and a bigint, since they
    * both convert to Complex.
    */
   'Complex,number': ({
      'self(number,number)': addNum,
      'complex(any,any)': cplx
   }) => (z,x) => cplx(addNum(z.re, x), z.im),

   'Complex,bigint': ({
      'self(bigint,bigint)': addBigInt,
      'complex(any,any)': cplx
   }) => (z,x) => cplx(addBigInt(z.re, x), z.im),

   'Complex,Complex': ({
      self,
      'complex(any,any)': cplx
   }) => (w,z) => cplx(self(w.re, z.re), self(w.im, z.im))
}
