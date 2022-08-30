import Returns from '../core/Returns.mjs'
export {Tuple} from './Types/Tuple.mjs'

export const length = {'Tuple<T>': () => Returns('NumInt', t => t.elts.length)}
