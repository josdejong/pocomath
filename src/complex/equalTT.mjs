export * from './Types/Complex.mjs'

export const equalTT = {
   'Complex<T>,Complex<T>': ({
      'self(T,T)': me
   }) => (w,z) => me(w.re, z.re) && me(w.im, z.im),
   // NOTE: Although I do not understand exactly why, with typed-function@3.0's
   // matching algorithm, the above template must come first to ensure the
   // most specific match to a template call. I.e, if one of the below
   // comes first, a call with two complex numbers can match via conversions
   // with (Complex<Complex<number>>, Complex<number>) (!, hopefully in some
   // future iteration typed-function will be smart enough to prefer
   // Complex<T>, Complex<T>. Possibly the problem is in Pocomath's bolted-on
   // type resolution and the difficulty will go away when features are moved into
   // typed-function.
   'Complex<T>,T': ({
      'isZero(T)': isZ,
      'self(T,T)': eqReal
   }) => (z, x) => eqReal(z.re, x) && isZ(z.im),

   'T,Complex<T>': ({
      'isZero(T)': isZ,
      'self(T,T)': eqReal
   }) => (b, z) => eqReal(z.re, b) && isZ(z.im),

}
