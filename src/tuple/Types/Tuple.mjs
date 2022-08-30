/* A template type representing a homeogeneous tuple of elements */
import PocomathInstance from '../../core/PocomathInstance.mjs'
import {Returns, returnTypeOf} from '../../core/Returns.mjs'

const Tuple = new PocomathInstance('Tuple')

Tuple.installType('Tuple<T>', {
   // A test that "defines" the "base type", which is not really a type
   // (only fully instantiated types are added to the universe)
   base: t => t && typeof t === 'object' && 'elts' in t && Array.isArray(t.elts),
   // The template portion of the test; it takes the test for T as
   // input and returns the test for an entity _that already passes
   // the base test_ to be a Tuple<T>:
   test: testT => t => t.elts.every(testT),
   // And we need there to be a way to determine the (instantiation)
   // type of an tuple (that has already passed the base test):
   infer: ({typeOf, joinTypes}) => t => joinTypes(t.elts.map(typeOf)),
   // Conversions. Parametrized conversions are only invoked for types
   // U such that there is already a conversion from U to T, and that
   // conversion is passed as an input, and we have to return the conversion
   // function from the indicated template in terms of U to Tuple<T>:
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
   'Tuple<T>': ({
      'self(T)': me,
      tuple
   }) => {
      const compType = me.fromInstance.joinTypes(
         returnTypeOf(me).split('|'), 'convert')
      return Returns(
         `Tuple<${compType}>`, t => tuple(...(t.elts.map(x => me(x)))))
   }
}

Tuple.promoteBinaryUnary = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, 'self(T)': meU, tuple}) => {
      const compTypes = returnTypeOf(meB).split('|').concat(
         returnTypeOf(meU).split('|'))
      const compType = meU.fromInstance.joinTypes(compTypes, 'convert')
      return Returns(`Tuple<${compType}>`, (s,t) => {
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
      })
   }
}

Tuple.promoteBinary = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, tuple}) => {
      const compType = meB.fromInstance.joinTypes(
         returnTypeOf(meB).split('|'))
      return Returns(`Tuple<${compType}>`, (s,t) => {
         const lim = Math.max(s.elts.length, t.elts.length)
         const result = []
         for (let i = 0; i < lim; ++i) {
            result.push(meB(s.elts[i], t.elts[i]))
         }
         return tuple(...result)
      })
   }
}

Tuple.promoteBinaryStrict = {
   'Tuple<T>,Tuple<T>': ({'self(T,T)': meB, tuple}) => {
      const compType = meB.fromInstance.joinTypes(
         returnTypeOf(meB).split('|'))
      return Returns(`Tuple<${compType}>`, (s,t) => {
         if (s.elts.length !== t.elts.length) {
            throw new RangeError('Tuple length mismatch') // get name of self ??
         }
         const result = []
         for (let i = 0; i < s.elts.length; ++i) {
            result.push(meB(s.elts[i], t.elts[i]))
         }
         return tuple(...result)
      })
   }
}

export {Tuple}
