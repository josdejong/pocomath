import {adapted} from './Types/adapted.mjs'
import Fraction from 'fraction.js/bigfraction.js'
import Returns from '../core/Returns.mjs'

export * from './arithmetic.mjs'
export * from './relational.mjs'

export const fraction = adapted('Fraction', Fraction, {
   before: ['Complex'],
   from: {number: n => new Fraction(n)},
   operations: {
      compare: {
         'Fraction,Fraction': () => Returns(
            'Fraction', (f,g) => new Fraction(f.compare(g)))
      },
      mod: {
         'Fraction,Fraction': () => Returns('Fraction', (n,d) => {
            // patch for "mathematician's modulus"
            // OK to use full public API of Fraction here
            const fmod = n.mod(d)
            if (fmod.s === -1n) return fmod.add(d.abs())
            return fmod
         })
      }
   }
})
