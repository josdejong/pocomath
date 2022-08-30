import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const absquare = {
   'Complex<T>': ({
      add, // no easy way to write the needed signature; if T is number
           // it is number,number; but if T is Complex<bigint>, it is just
           // bigint,bigint. So unfortunately we depend on all of add, and
           // we extract the needed implementation below.
      'self(T)': absq
   }) => {
      const midType = returnTypeOf(absq)
      const addImp = add.fromInstance.resolve(
         'add', `${midType},${midType}`, add)
      return Returns(
         returnTypeOf(addImp), z => addImp(absq(z.re), absq(z.im)))
   }
}

/* We could imagine notations that Pocomath could support that would simplify
 * the above, maybe something like
 * 'Complex<T>': ({
 *    'self(T): U': absq,
 *    'add(U,U):V': plus,
 *    V
 *  }) => Returns(V, z => plus(absq(z.re), absq(z.im)))
 */
