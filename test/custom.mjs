import assert from 'assert'
import math from '../src/pocomath.mjs'
import PocomathInstance from '../src/core/PocomathInstance.mjs'
import * as numbers from '../src/number/all.mjs'
import * as numberAdd from '../src/number/add.mjs'
import * as complex from '../src/complex/all.mjs'
import * as complexAdd from '../src/complex/add.mjs'
import * as complexNegate from '../src/complex/negate.mjs'
import * as complexComplex from '../src/complex/complex.mjs'
import * as concreteSubtract from '../src/generic/subtract.concrete.mjs'
import * as genericSubtract from '../src/generic/subtract.mjs'
import extendToComplex from '../src/complex/extendToComplex.mjs'

const bw = new PocomathInstance('backwards')
describe('A custom instance', () => {
   it("works when partially assembled", () => {
      bw.install(complex)
      // Not much we can call without any number types:
      assert.deepStrictEqual(bw.complex(0, 3), {re: 0, im: 3})
      // Don't have a way to negate things, for example:
      assert.throws(() => bw.negate(2), TypeError)
   })

   it("can be assembled in any order", () => {
      bw.install(numbers)
      bw.install({Types: {string: {test: s => typeof s === 'string'}}})
      assert.strictEqual(bw.subtract(16, bw.add(3,4,2)), 7)
      assert.strictEqual(bw.negate('8'), -8)
      assert.deepStrictEqual(bw.add(bw.complex(1,3), 1), {re: 2, im: 3})
      assert.deepStrictEqual(
         bw.subtract(16, bw.add(3, bw.complex(0,4), 2)),
         math.complex(11, -4)) // note both instances coexist
      assert.deepStrictEqual(bw.negate(math.complex(3, '8')).im, -8)
   })

   it("can be assembled piecemeal", () => {
      const pm = new PocomathInstance('piecemeal')
      pm.install(numbers)
      assert.strictEqual(pm.subtract(5, 10), -5)
      pm.install(complexAdd)
      pm.install(complexNegate)
      // Should be enough to allow complex subtraction, as subtract is generic:
      assert.deepStrictEqual(
         pm.subtract({re:5, im:0}, {re:10, im:1}), {re:-5, im: -1})
   })

   it("can selectively import in cute ways", async function () {
      const cherry = new PocomathInstance('cherry')
      cherry.install(numberAdd)
      await extendToComplex(cherry)
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

})
