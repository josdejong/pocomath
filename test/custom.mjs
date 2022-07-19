import assert from 'assert'
import typed from 'typed-function'
import PocomathInstance from '../PocomathInstance.mjs'
import * as numbers from '../number/all.mjs'
import * as complex from '../complex/all.mjs'

const bw = new PocomathInstance('backwards')
describe('A custom instance', () => {
   it("works when partially assembled", () => {
      bw.install(complex)
      assert.deepStrictEqual(bw.add(2, bw.complex(0, 3)), {re: 2, im: 3})
   })

   it("can be assembled in any order", () => {
      bw.install(numbers)
      typed.addConversion({from: 'string', to: 'number', convert: x => +x})
      assert.strictEqual(bw.subtract(16, bw.add(3,4,2)), 7)
      assert.strictEqual(bw.negate('8'), -8)
      assert.deepStrictEqual(bw.add(bw.complex(1,3), 1), {re: 2, im: 3})
   })
})
