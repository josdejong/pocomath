/* Call this with an empty Set object S, and it returns an entity E
 * from which properties can be extracted, and at any time S will
 * contain all of the property names that have been extracted from E.
 */
export function dependencyExtractor(destinationSet) {
   return new Proxy({}, {
      get: (target, property) => {
         destinationSet.add(property)
         return {}
      }
   })
}

/* Given a (template) type name, what the template parameter is,
 * a top level typer, and a library of templates,
 * produces a function that will extract the instantantion type from an
 * instance. Currently relies heavily on there being only unary templates.
 *
 * We should really be using the typed-function parser to do the
 * manipulations below, but at the moment we don't have access.
 */
export function generateTypeExtractor(
   type, param, topTyper, typeJoiner, templates)
{
   type = type.trim()
   if (type.slice(0,3) === '...') {
      type = type.slice(3).trim()
   }
   if (type === param) return topTyper
   if (!(type.includes('<'))) return false // no template type to extract
   const base = type.split('<',1)[0]
   if (!(base in templates)) return false // unknown template
   const arg = type.slice(base.length+1, -1)
   const argExtractor = generateTypeExtractor(
      arg, param, topTyper, typeJoiner, templates)
   if (!argExtractor) return false
   return templates[base].spec.infer({
      typeOf: argExtractor,
      joinTypes: typeJoiner
   })
}
