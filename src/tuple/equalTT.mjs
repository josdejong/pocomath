export * from './Types/Tuple.mjs'

export const equalTT = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': me, 'length(Tuple)': len}) => (s,t) => {
      if (len(s) !== len(t)) return false
      for (let i = 0; i < len(s); ++i) {
         if (!me(s.elts[i], t.elts[i])) return false
      }
      return true
   }
}
