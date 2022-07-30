export * from './roundquotient.mjs'

export const quotient = {
   'Complex,Complex': ({roundquotient}) => (w,z) => roundquotient(w,z)
}
