import typed from 'typed-function'

typed.addType({name: 'bigint', test: b => typeof b === 'bigint'})
