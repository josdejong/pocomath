import assert from 'assert'
import math from '../../src/pocomath.mjs'

describe('tuple', () => {
   it('can be created and provide its length', () => {
      assert.strictEqual(math.length(math.tuple(3, 5.2, 2)), 3)
   })

   it('does not allow unification by converting consecutive arguments', () => {
      assert.throws(() => math.tuple(3, 5.2, 2n), /TypeError.*unif/)
      assert.throws(
         () => math.tuple(3, 2n, math.complex(5.2)),
         /TypeError.*unif/)
      assert.throws(
         () => math.tuple(3, math.complex(2n), 5.2),
         /TypeError.*unif/)
   })

   it('can be tested for zero and equality', () => {
      assert.strictEqual(math.isZero(math.tuple(0,1)), false)
      assert.strictEqual(math.isZero(math.tuple(0n,0n,0n,0n)), true)
      assert.strictEqual(math.isZero(math.tuple(0,0.001,0)), false)
      assert.deepStrictEqual(math.complex(0,0), {re: 0, im:0})
      assert.strictEqual(math.isZero(math.tuple(0,math.complex(0,0))), true)
      assert.strictEqual(
         math.equal(
            math.tuple(0,math.complex(0,0.1)),
            math.complex(math.tuple(0,0), math.tuple(0,0.1))),
         true)
      assert.strictEqual(
         math.equal(math.tuple(3n,2n), math.tuple(3,2)),
         false)
   })

   it('supports addition', () => {
      assert.deepStrictEqual(
         math.add(math.tuple(3,4,5), math.tuple(2,1,0)),
         math.tuple(5,5,5))
      assert.deepStrictEqual(
         math.add(math.tuple(3.25,4.5,5), math.tuple(3,3)),
         math.tuple(6.25,7.5,5))
      assert.deepStrictEqual(
         math.add(math.tuple(math.complex(2,3), 7), math.tuple(4, 5, 6)),
         math.tuple(math.complex(6,3), math.complex(12), math.complex(6)))
      assert.deepStrictEqual(
         math.add(math.tuple(5,6), 7),
         math.tuple(12,6))
      assert.deepStrictEqual(
         math.add(math.tuple(math.complex(5,4),6), 7),
         math.tuple(math.complex(12,4),math.complex(6)))
   })

   it('supports subtraction', () => {
      assert.deepStrictEqual(
         math.subtract(math.tuple(3n,4n,5n), math.tuple(2n,1n,0n)),
         math.tuple(1n,3n,5n))
      assert.deepStrictEqual(
         math.returnTypeOf('subtract', 'Tuple<bigint>,Tuple<bigint>'),
         'Tuple<bigint>')
      assert.throws(
         () => math.subtract(math.tuple(5,6), math.tuple(7)),
         /RangeError/)
   })

   it('makes a tuple of complex and conjugates it', () => {
      const complexTuple = math.tuple(
         math.complex(3,1), math.complex(4,2.2), math.complex(5,3))
      assert.deepStrictEqual(
         math.complex(math.tuple(3,4,5), math.tuple(1,2.2,3)),
         complexTuple)
      assert.deepStrictEqual(
         math.conjugate(complexTuple),
         math.tuple(math.complex(3,-1), math.complex(4,-2.2), math.complex(5,-3)))
   })

   it('supports division', () => {
      assert.deepStrictEqual(
         math.divide(math.tuple(3,4,5),math.tuple(1,2,2)),
         math.tuple(3,2,2.5))
   })

   it('supports multiplication', () => {
      assert.deepStrictEqual(
         math.multiply(math.tuple(3,4,5), math.tuple(1,2,2)),
         math.tuple(3,8,10))
   })

   it('supports one and zero', () => {
      assert.deepStrictEqual(
         math.one(math.tuple(2n,3n,0n)),
         math.tuple(1n,1n,1n))
      assert.deepStrictEqual(
         math.zero(math.tuple(math.complex(5,2), 3.4)),
         math.tuple(math.complex(0), math.complex(0)))
   })

   it('supports quotient and roundquotient', () => {
      const bigTuple = math.tuple(1n,2n,3n,4n,5n)
      const bigOnes = math.one(bigTuple)
      const threes = math.add(bigOnes, bigOnes, bigOnes)
      assert.deepStrictEqual(
         math.quotient(bigTuple, threes),
         math.tuple(0n, 0n, 1n, 1n, 1n))
      assert.deepStrictEqual(
         math.roundquotient(bigTuple, threes),
         math.tuple(0n, 1n, 1n, 1n, 2n))
   })

   it('supports sqrt', () => {
      const mixedTuple = math.tuple(2, math.complex(0,2), 1.5)
      assert.deepStrictEqual(
         mixedTuple,
         math.tuple(math.complex(2), math.complex(0,2), math.complex(1.5)))
      assert.strictEqual(
         math.returnTypeOf('tuple', 'NumInt, Complex<NumInt>, number'),
         'Tuple<Complex<number>>')
      assert.deepStrictEqual(math.sqrt(math.tuple(4,-4,2.25)), mixedTuple)
      assert.strictEqual(
         math.returnTypeOf('sqrt', 'Tuple<NumInt>'), 'Tuple<Complex<number>>')
   })

})
