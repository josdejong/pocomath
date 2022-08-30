import assert from 'assert'
import * as utils from '../../src/core/utils.mjs'

describe('typeListOfSignature', () => {
   it('returns an empty list for the empty signature', () => {
      assert.deepStrictEqual(utils.typeListOfSignature(''), [])
   })
})
