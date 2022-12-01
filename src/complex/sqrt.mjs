import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const sqrt = {
   'Complex<T>': ({
      config,
      'sqrtc(Complex<T>)': predictableSqrt,
      'isZero(T)': isZ,
   }) => {
      if (config.checkingDependency) return undefined
      const complexReturns = returnTypeOf(predictableSqrt)
      const baseReturns = complexReturns.slice(8, -1); // Complex<WhatWeWant>
      if (config.predictable) {
         return Returns(complexReturns, z => predictableSqrt(z))
      }

      return Returns(
         `Complex<${baseReturns}>|${baseReturns}|undefined`,
         z => {
            let complexSqrt
            try {
               complexSqrt = predictableSqrt(z)
            } catch (e) {
               return undefined
            }
            if (complexSqrt.re === undefined || complexSqrt.im === undefined) {
               return undefined
            }
            if (isZ(complexSqrt.im)) return complexSqrt.re
            return complexSqrt
         }
      )
   }
}
