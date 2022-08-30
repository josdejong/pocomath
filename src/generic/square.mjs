import {Returns, returnTypeOf} from '../core/Returns.mjs'

export const square = {
   T: ({'multiply(T,T)': multT}) => Returns(
      returnTypeOf(multT), x => multT(x,x))
}
