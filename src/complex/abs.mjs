import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const abs = {
   'Complex<T>': ({
      sqrt, // Unfortunately no notation yet for the needed signature
      'absquare(T)': baseabsq,
      'absquare(Complex<T>)': absq
   }) => {
      const midType = returnTypeOf(baseabsq)
      const sqrtImp = sqrt.fromInstance.resolve('sqrt', midType, sqrt)
      let retType = returnTypeOf(sqrtImp)
      if (retType.includes('|')) {
         // This is a bit of a hack, as it relies on all implementations of
         // sqrt returning the "typical" return type as the first option
         retType = retType.split('|',1)[0]
      }
      return Returns(retType, z => sqrtImp(absq(z)))
   }
}
