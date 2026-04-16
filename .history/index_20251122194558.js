/**
 * A simple utility library
 */

function capitalize(str) {
	if (typeof str !== 'string') return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatCurrency(amount, currency = 'USD') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
	}).format(amount)
}

// Export your functions
module.exports = {
	capitalize,
	formatCurrency,
}
