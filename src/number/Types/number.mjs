import PocomathInstance from '../../core/PocomathInstance.mjs'
const Number = new PocomathInstance('Number')
Number.installType('number', {
    before: ['Complex'],
    test: n => typeof n === 'number',
    from: {string: s => +s}
})
Number.installType('NumInt', {
    refines: 'number',
    test: i => isFinite(i) && i === Math.round(i)
})

export {Number}
