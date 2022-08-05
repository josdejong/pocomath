/* A template type representing a homeogeneous tuple of elements */
import PocomathInstance from '../../core/PocomathInstance.mjs'

const Tuple = new PocomathInstance('Tuple')
// First a base type that will generally not be used directly
Tuple.installType('Tuple', {
   test: t => t && typeof t === 'object' && 'elts' in t && Array.isArray(t.elts)
})
// Now the template type that is the primary use of this
Tuple.installType('Tuple<T>', {
   // We are assuming that any 'Type<T>' refines 'Type', so this is
   // not necessary:
   // refines: 'Tuple',
   // But we need there to be a way to determine the type of a tuple:
   infer: ({typeOf, joinTypes}) => t => joinTypes(t.elts.map(typeOf)),
   // For the test, we can assume that t is already a base tuple,
   // and we get the test for T as an input and we have to return
   // the test for Tuple<T>
   test: testT => t => t.elts.every(testT),
   // These are only invoked for types U such that there is already
   // a conversion from U to T, and that conversion is passed as an input
   // and we have to return the conversion to Tuple<T>:
   from: {
      'Tuple<U>': convert => tu => ({elts: tu.elts.map(convert)}),
      // Here since there is no U it's a straight conversion:
      T: t => ({elts: [t]}), // singleton promotion
      // Whereas the following will let you go directly from an element
      // convertible to T to a singleton Tuple<T>. Not sure if we really
      // want that, but we'll try it just for kicks.
      U: convert => u => ({elts: [convert(u)]})
   }
})

Tuple.promoteUnary = {
   'Tuple<T>': ({'self(T)': me, tuple}) => t => tuple(...(t.elts.map(me)))
}

Tuple.promoteBinaryUnary = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, 'self(T)': meU, tuple}) => (s,t) => {
      let i = -1
      let result = []
      while (true) {
         i += 1
         if (i < s.elts.length) {
            if (i < t.elts.length) result.push(meB(s.elts[i], t.elts[i]))
            else result.push(meU(s.elts[i]))
            continue
         }
         if (i < t.elts.length) result.push(meU(t.elts[i]))
         else break
      }
      return tuple(...result)
   }
}

Tuple.promoteBinary = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, tuple}) => (s,t) => {
      const lim = Math.max(s.elts.length, t.elts.length)
      const result = []
      for (let i = 0; i < lim; ++i) {
         result.push(meB(s.elts[i], t.elts[i]))
      }
      return tuple(...result)
   }
}

Tuple.promoteBinaryStrict = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, tuple}) => (s,t) => {
      if (s.elts.length !== t.elts.length) {
         throw new RangeError('Tuple length mismatch') // get name of self ??
      }
      const result = []
      for (let i = 0; i < s.elts.length; ++i) {
         result.push(meB(s.elts[i], t.elts[i]))
      }
      return tuple(...result)
   }
}

export {Tuple}
