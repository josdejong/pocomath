import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

/* Returns cosine plus i sin theta */
export const cis = {
   'number': ({'complex(number,number)': cplx}) => Returns(
      'Complex<number>', t => cplx(Math.cos(t), Math.sin(t))
   )
}
