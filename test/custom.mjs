import assert from 'assert'
import math from '../pocomath.mjs'
import typed from 'typed-function'
import PocomathInstance from '../PocomathInstance.mjs'
import * as numbers from '../number/all.mjs'
import * as numberAdd from '../number/add.mjs'
import * as complex from '../complex/all.mjs'
import * as complexAdd from '../complex/add.mjs'
import * as complexNegate from '../complex/negate.mjs'
import extendToComplex from '../complex/extendToComplex.mjs'

const bw = new PocomathInstance('backwards')
describe('A custom instance', () => {
   it("works when partially assembled", () => {
      bw.install(complex)
      assert.deepStrictEqual(bw.add(2, bw.complex(0, 3)), {re: 2, im: 3})
      assert.deepStrictEqual(bw.negate(2), bw.complex(-2,-0))
      assert.deepStrictEqual(bw.subtract(2, bw.complex(0, 3)), {re: 2, im: -3})
   })

   it("can be assembled in any order", () => {
      bw.install(numbers)
      typed.addConversion({from: 'string', to: 'number', convert: x => +x})
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
      // Should be enough to allow complex subtraction, as subtract is generic
      assert.deepStrictEqual(
         pm.subtract({re:5, im:0}, {re:10, im:1}), {re:-5, im: -1})
   })

   it("can selectively import in cute ways", async function () {
      const cherry = new PocomathInstance('cherry')
      cherry.install(numberAdd)
      await extendToComplex(cherry)
      // Now we have an instance that supports addition for number and complex
      // and little else:
      assert.strictEqual(cherry.add(3, 4, 2), 9)
      assert.deepStrictEqual(
         cherry.add(cherry.complex(3, 3), 4, cherry.complex(2, 2)),
         math.complex(9,5))
      assert.strictEqual('subtract' in cherry, false)
      assert.strictEqual('negate' in cherry, false)
   })
})
