export const compare = {
   'undefined,undefined': () => () => 0
}

export const isZero = {
   'undefined': () => u => u === 0
}

export const equal = {
   '!T,T': ({
      'compare(T,T)': cmp,
      'isZero(T)': isZ
   }) => (x,y) => isZ(cmp(x,y))
}

export const unequal = {
   'T,T': ({'equal(T.T)': eq}) => (x,y) => !(eq(x,y))
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
