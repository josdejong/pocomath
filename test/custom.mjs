import assert from 'assert'
import math from '../src/pocomath.mjs'
import PocomathInstance from '../src/core/PocomathInstance.mjs'
import * as numbers from '../src/number/all.mjs'
import * as numberAdd from '../src/number/add.mjs'
import * as numberZero from '../src/number/zero.mjs'
import {add as genericAdd} from '../src/generic/arithmetic.mjs'
import * as complex from '../src/complex/all.mjs'
import * as complexAdd from '../src/complex/add.mjs'
import * as complexNegate from '../src/complex/negate.mjs'
import * as complexComplex from '../src/complex/complex.mjs'
import * as bigintAdd from '../src/bigint/add.mjs'
import * as bigintZero from '../src/bigint/zero.mjs'
import * as concreteSubtract from '../src/generic/subtract.concrete.mjs'
import * as genericSubtract from '../src/generic/subtract.mjs'
import extendToComplex from '../src/complex/extendToComplex.mjs'

const bw = new PocomathInstance('backwards')
describe('A custom instance', () => {
   it("works when partially assembled", () => {
      bw.install(complex)
      // Not much we can call without any number types:
      assert.deepStrictEqual(bw.complex(undefined, undefined), undefined)
      assert.deepStrictEqual(
         bw.chain(undefined).complex(undefined).value,
         undefined)
      // Don't have a way to negate things, for example:
      assert.throws(() => bw.negate(2), TypeError)
   })

   it("can be assembled in any order", () => {
      bw.install(numbers)
      bw.installType('string', {test: s => typeof s === 'string'})
      assert.strictEqual(bw.subtract(16, bw.add(3,4,2)), 7)
      assert.strictEqual(bw.negate('8'), -8)
      assert.deepStrictEqual(bw.add(bw.complex(1,3), 1), {re: 2, im: 3})
      assert.deepStrictEqual(
         bw.subtract(16, bw.add(3, bw.complex(0,4), 2)),
         math.complex(11, -4)) // note both instances coexist
      assert.deepStrictEqual(bw.negate(bw.complex(3, '8')).im, -8)
   })

   it("can be assembled piecemeal", () => {
      const pm = new PocomathInstance('piecemeal')
      pm.install(numbers)
      assert.strictEqual(pm.subtract(5, 10), -5)
      assert.strictEqual(pm.floor(3.7), 3)
      assert.throws(() => pm.floor(10n), TypeError)
      assert.strictEqual(pm.chain(5).add(7).value, 12)
      pm.install(complexAdd)
      pm.install(complexNegate)
      pm.install(complexComplex)
      // Should be enough to allow complex subtraction, as subtract is generic:
      assert.deepStrictEqual(
         pm.subtract(pm.complex(5, 0), pm.complex(10, 1)),
         math.complex(-5, -1))
      // And now floor has been activated for Complex as well, since the type
      // is present
      const fracComplex = math.complex(1.9, 0)
      const intComplex = math.complex(1)
      assert.deepStrictEqual(pm.floor(fracComplex), intComplex)
      // And the chain functions refresh themselves:
      assert.deepStrictEqual(
         pm.chain(5).add(pm.chain(0).complex(7).value).value, math.complex(5,7))
   })

   it("can defer definition of (even used) types", () => {
      const dt = new PocomathInstance('Deferred Types')
      dt.install(numberAdd)
      dt.install(numberZero) // for promoting numbers to complex, to fill in im
      dt.install({times: {
         'number,number': () => (m,n) => m*n,
         'Complex<T>,Complex<T>': ({'complex(T,T)': cplx}) => (w,z) => {
            return cplx(w.re*z.re - w.im*z.im, w.re*z.im + w.im*z.re)
         }
      }})
      // complex type not present but should still be able to add numbers:
      assert.strictEqual(dt.times(3,5), 15)
      dt.install(complexComplex)
      // times should now rebundle to allow complex:
      assert.deepStrictEqual(
         dt.times(dt.complex(2,3), dt.complex(2,-3)), dt.complex(13))
   })

   it("can selectively import in cute ways", async function () {
      const cherry = new PocomathInstance('cherry')
      cherry.install(numberAdd)
      cherry.install(numberZero) // for complex promotion
      await extendToComplex(cherry)
      cherry.install({add: genericAdd})
      /* Now we have an instance that supports addition for number and complex
         and little else:
      */
      assert.strictEqual(cherry.add(3, 4, 2), 9)
      assert.deepStrictEqual(
         cherry.add(cherry.complex(3, 3), 4, cherry.complex(2, 2)),
         math.complex(9,5))
      assert.strictEqual('subtract' in cherry, false)
      assert.strictEqual('negate' in cherry, false)
   })

   it("can use bundles that are closed under dependency", () => {
      const ok = new PocomathInstance('concrete')
      ok.install(concreteSubtract)
      assert.strictEqual(ok.subtract(7, 5), 2)
   })

   it("can load generics and then import their dependences", async function () {
      const chase = new PocomathInstance('Chase Dependencies')
      chase.install(genericSubtract)
      chase.install(complexComplex) // for convenience to build complex numbers
      await chase.importDependencies(['bigint', 'complex'])
      /* Now we have an instance that supports subtraction for Gaussian
         integers.
      */
      assert.deepStrictEqual(
         chase.subtract(chase.complex(3n, 2n), chase.complex(2n, 5n)),
         math.complex(1n, -3n))
   })

   it("instantiates templates correctly", () => {
      const inst = new PocomathInstance('InstantiateTemplates')
      inst.install(numberAdd)
      inst.install({typeMerge: {'T,T': ({T}) => (t,u) => 'Merge to ' + T }})
      assert.strictEqual(inst.typeMerge(7,6.28), 'Merge to number')
      assert.strictEqual(inst.typeMerge(7,6), 'Merge to NumInt')
      assert.strictEqual(inst.typeMerge(7.35,6), 'Merge to number')
      inst.install(complexAdd)
      inst.install(complexComplex)
      inst.install(bigintAdd)
      inst.install(bigintZero) // for complex promotion
      assert.strictEqual(
         inst.typeMerge(6n, inst.complex(3n, 2n)),
         'Merge to Complex<bigint>')
      assert.strictEqual(
         inst.typeMerge(3, inst.complex(4.5,2.1)),
         'Merge to Complex<number>')
      // The following is the current behavior, since 3 converts to 3+0i
      // which is technically the same Complex type as 3n+0ni.
      // This should clear up when Complex is templatized
      assert.strictEqual(inst.typeMerge(3, inst.complex(3n)), 'Merge to Complex')
      // But types that truly cannot be merged should throw a TypeError
      // Should add a variation of this with a more usual type once there is
      // one not interconvertible with others...
      inst.install(genericSubtract)
      assert.throws(() => inst.typeMerge(3, undefined), TypeError)
   })
})
