export {Types} from './Types/number.mjs'

export const add = {
   '...number': () => addends => addends.reduce((x,y) => x+y, 0),
}
