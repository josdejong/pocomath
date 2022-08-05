export {Tuple} from './Types/Tuple.mjs'

/* The purpose of the template argument is to ensure that all of the args
 * are convertible to the same type.
 */
export const tuple = {'...T': () => args => ({elts: args})}
