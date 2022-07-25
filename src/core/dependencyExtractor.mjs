/* Call this with an empty Set object S, and it returns an entity E
 * from which properties can be extracted, and at any time S will
 * contain all of the property names that have been extracted from E.
 */
export default function dependencyExtractor(destinationSet) {
   return new Proxy({}, {
      get: (target, property) => {
         destinationSet.add(property)
         return {}
      }
   })
}
