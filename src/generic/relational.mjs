import Returns from '../core/Returns.mjs'

export const compare = {
   'undefined,undefined': () => Returns('NumInt', () => 0)
}

export const isZero = {
   'undefined': () => Returns('boolean', u => u === 0),
   T: ({
      T,
      'equal(T,T)': eq,
      'zero(T)': zr
   }) => Returns('boolean', t => eq(t, zr(t)))
}

export const equal = {
   'any,any': ({
      equalTT,
      joinTypes,
      Templates,
      typeOf
   }) => Returns('boolean', (x,y) => {
      const resultant = joinTypes([typeOf(x), typeOf(y)], 'convert')
      if (resultant === 'any' || resultant in Templates) {
         return false
      }
      return equalTT(x,y)
   })
}

export const equalTT = {
   'T,T': ({
      'compare(T,T)': cmp,
      'isZero(T)': isZ
   }) => Returns('boolean', (x,y) => isZ(cmp(x,y)))
   // If templates were native to typed-function, we should be able to
   // do something like:
   // 'any,any': () => () => false // should only be hit for different types
}

export const unequal = {
   'any,any': ({equal}) => Returns('boolean', (x,y) => !(equal(x,y)))
}

export const larger = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      'equalTT(T,T)' : eq
   }) => Returns('boolean', (x,y) => eq(cmp(x,y), uno(y)))
}

export const largerEq = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      'isZero(T)' : isZ,
      'equalTT(T,T)': eq
   }) => Returns('boolean', (x,y) => {
      const c = cmp(x,y)
      return isZ(c) || eq(c, uno(y))
   })
}

export const smaller = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      'isZero(T)' : isZ,
      unequal
   }) => Returns('boolean', (x,y) => {
      const c = cmp(x,y)
      return !isZ(c) && unequal(c, uno(y))
   })
}

export const smallerEq = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      unequal
   }) => Returns('boolean', (x,y) => unequal(cmp(x,y), uno(y)))
}
