import assert from 'assert'
import dependencyExtractor from '../../src/core/dependencyExtractor.mjs'

describe('dependencyExtractor', () => {
   it('will record the keys of a destructuring function', () => {
      const myfunc = ({a, 'b(x)': b, c: alias}) => 0
      const params = new Set()
      myfunc(dependencyExtractor(params))
      assert.ok(params.has('a'))
      assert.ok(params.has('b(x)'))
      assert.ok(params.has('c'))
      assert.ok(params.size === 3)
   })

   it('does not pick up anything from a regular function', () => {
      const myfunc = arg => 0
      const params = new Set()
      myfunc(dependencyExtractor(params))
      assert.ok(params.size === 0)
   })

})
