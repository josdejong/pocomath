import {use} from '../core/PocomathInstance.mjs'
export {Types} from './Types/bigint.mjs'

export const add = {
   '...bigint': use([], addends => addends.reduce((x,y) => x+y, 0n))
}
