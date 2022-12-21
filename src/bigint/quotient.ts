import { Quotient, Sign } from '../interfaces/arithmetic.js'

export type QuotientBigInt = Quotient<bigint>

// Here we use Sign<bigint>, whereas there is only a generic implementation
// We can know that because there is no SignBigInt type defined, 
// but, it doesn't matter: we don't care if it is a generic implementation or not

/* Returns the floor integer approximation to n/d */
export const quotient = {
   'infer': ({ sign }: {
      sign: Sign<bigint>
   }): QuotientBigInt => (n, d) => {
      const dSign = sign(d)
      if (dSign === 0n) return 0n
      if (sign(n) === dSign) return n / d
      const quot = n / d
      if (quot * d == n) return quot
      return quot - 1n
   }
}
