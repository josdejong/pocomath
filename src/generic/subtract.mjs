export const subtract = {
   'any,any': [['add', 'negate'], ref => (x,y) => ref.add(x, ref.negate(y))]
} 
