export * from './Types/number.mjs'

const intquotient = () => (n,d) => {
   if (d === 0) return d
   return Math.floor(n/d)
}

export const quotient = {
   // Hmmm, seem to need all of these because of the generic template version
   // Should be a way around that
   'NumInt,NumInt': intquotient,
   'NumInt,number': intquotient,
   'number,NumInt': intquotient,
   'number,number': intquotient
}
