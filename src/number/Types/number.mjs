export const Types = {
    number: {
        before: ['Complex'],
        test: n => typeof n === 'number',
        from: {string: s => +s}
    }
}

