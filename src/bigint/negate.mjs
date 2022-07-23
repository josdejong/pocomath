import {use} from '../core/PocomathInstance.mjs'
export {Types} from './Types/bigint.mjs'

export const negate = {bigint: use([], b => -b)}
