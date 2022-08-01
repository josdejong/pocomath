export const mean = {
   '...any': ({add, divide}) => args => divide(add(...args), args.length)
}
