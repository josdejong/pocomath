import './BigInt.mjs'
export const add = {
   '...bigint': [[], addends => addends.reduce((x,y) => x+y, 0n)],
}
