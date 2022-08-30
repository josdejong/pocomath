/* Returns true if set is a subset of the keys of obj */
export function subsetOfKeys(set, obj) {
   for (const e of set) {
      if (!(e in obj)) return false
   }
   return true
}

/* Returns a list of the types mentioned in a typed-function signature */
export function typeListOfSignature(signature) {
   signature = signature.trim()
   if (!signature) return []
   return signature.split(',').map(s => s.trim())
}

/* Returns a set of all of the types mentioned in a typed-function signature */
export function typesOfSignature(signature) {
   return new Set(signature.split(/[^\w\d]/).filter(s => s.length))
}
