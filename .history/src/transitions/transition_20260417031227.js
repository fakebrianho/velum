// lib/velum/transition.js

export async function runTransition(registry, context) {
	if (!registry || typeof registry.resolve !== 'function') {
		throw new Error('runTransition: invalid transition registry passed in')
	}

	const match = registry.resolve(context)

	if (!match) {
		// no transition registered at all, just reveal next immediately
		context.to.style.opacity = '1'
		return
	}

	const result = match.handler({
		...context,
		transitionName: match.name,
	})

	if (isPromiseLike(result)) {
		await result
	}
}

function isPromiseLike(value) {
	return (
		value != null &&
		typeof value === 'object' &&
		typeof value.then === 'function'
	)
}
