import Returns from '../core/Returns.mjs'

export function identityType(type) {
   return () => Returns(type, x => x)
}

export function identitySubTypes(type) {
   return ({T}) => Returns(T, x => x)
}

export const identity = {T: ({T}) => Returns(T, x => x)}
