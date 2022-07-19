import typed from 'typed-function'

/* Use a plain object with keys re and im for a complex */
typed.addType({
   name: 'Complex',
   test: z => z && typeof z === 'object' && 're' in z && 'im' in z
})

typed.addConversion({
   from: 'number',
   to: 'Complex',
   convert: x => ({re: x, im: 0})
})

