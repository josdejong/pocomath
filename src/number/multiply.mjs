export {Types} from './Types/number.mjs'

export const multiply = {
   '...number': () => multiplicands => multiplicands.reduce((x,y) => x*y, 1),
}
