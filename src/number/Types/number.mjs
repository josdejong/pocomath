export const Type_number = {
    before: ['Complex'],
    test: n => typeof n === 'number',
    from: {string: s => +s}
}

