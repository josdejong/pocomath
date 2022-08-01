export const mod = {
   'T,T': ({
      'subtract(T,T)': subT,
      'multiply(T,T)': multT,
      'quotient(T,T)': quotT
   }) => (a,m) => subT(a, multT(m, quotT(a,m)))
}
