export * from './Types/Complex.mjs'

export const absquare = {
   Complex: ({add, square}) => z => add(square(z.re), square(z.im))
}
