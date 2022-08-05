export const compare = {
   'undefined,undefined': () => () => 0
}

export const isZero = {
   'undefined': () => u => u === 0
}

export const equal = {
   'any,any': ({equalTT, joinTypes, Templates, typeOf}) => (x,y) => {
      const resultant = joinTypes([typeOf(x), typeOf(y)], 'convert')
      if (resultant === 'any' || resultant in Templates) {
         return false
      }
      return equalTT(x,y)
   }
}

export const equalTT = {
   'T,T': ({
      'compare(T,T)': cmp,
      'isZero(T)': isZ
   }) => (x,y) => isZ(cmp(x,y)),
   // If templates were native to typed-function, we should be able to
   // do something like:
   // 'any,any': () => () => false // should only be hit for different types
}

export const unequal = {
   'any,any': ({equal}) => (x,y) => !(equal(x,y))
}

export const larger = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno
   }) => (x,y) => cmp(x,y) === uno(y)
}

export const largerEq = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      'isZero(T)' : isZ
   }) => (x,y) => {
      const c = cmp(x,y)
      return isZ(c) || c === uno(y)
   }
}

export const smaller = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno,
      'isZero(T)' : isZ
   }) => (x,y) => {
      const c = cmp(x,y)
      return !isZ(c) && c !== uno(y)
   }
}

export const smallerEq = {
   'T,T': ({
      'compare(T,T)': cmp,
      'one(T)' : uno
   }) => (x,y) => cmp(x,y) !== uno(y)
}
