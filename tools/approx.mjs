import assert from 'assert'

export const epsilon = 1e-12

const isNumber = entity => (typeof entity === 'number')

export function equal(a, b) {
   if (isNumber(a) && isNumber(b)) {
      if (a === b) return true
      if (isNaN(a)) return assert.strictEqual(a.toString(), b.toString())
      const message = `${a} ~= ${b} (to ${epsilon})`
      if (a === 0) return assert.ok(Math.abs(b) < epsilon, message)
      if (b === 0) return assert.ok(Math.abs(a) < epsilon, message)
      const diff = Math.abs(a - b)
      const maxDiff = Math.abs(epsilon * Math.max(Math.abs(a), Math.abs(b)))
      return assert.ok(diff <= maxDiff, message)
   }
   return assert.strictEqual(a, b)
}

export function deepEqual(a, b) {
   if (Array.isArray(a) && Array.isArray(b)) {
      const alen = a.length
      assert.strictEqual(alen, b.length, `${a} ~= ${b}`)
      for (let i = 0; i < alen; ++i) deepEqual(a[i], b[i])
      return true
   }
   if (typeof a === 'object' && typeof b === 'object') {
      for (const prop in a) {
         if (a.hasOwnProperty(prop)) {
            assert.ok(
               b.hasOwnProperty(prop), `a[${prop}] = ${a[prop]} ~= ${b[prop]}`)
            deepEqual(a[prop], b[prop])
         }
      }

      for (const prop in b) {
         if (b.hasOwnProperty(prop)) {
            assert.ok(
               a.hasOwnProperty(prop), `${a[prop]} ~= ${b[prop]} = b[${prop}]`)
         }
      }
      return true
   }
   return equal(a, b)
}
