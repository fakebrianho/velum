export function capitalize(str) {
	if (typeof str !== 'string') return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatCurrency(amount, currency = 'USD') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
	}).format(amount)
}

// Also export as default for CommonJS compatibility
export default {
	capitalize,
	formatCurrency,
}
export * from './src/router.js'
export * from './src/pageLoader.js'
export * from './src/transition.js'
export * from './src/transitions/fade.js'
