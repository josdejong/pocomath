export * from './Types/bigint.mjs'

export const multiply = {
   '...bigint': () => multiplicands => multiplicands.reduce((x,y) => x*y, 1n)
}
