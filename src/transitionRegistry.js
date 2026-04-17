// lib/velum/transitionRegistry.js

export function createTransitionRegistry(transitions = []) {
	const normalized = transitions.map(normalizeTransition)

	return {
		// Resolve which entry matches a given from/to namespace pair.
		// Priority: exact match > from-wildcard > to-wildcard > default (*->*)
		resolve({ fromNamespace, toNamespace }) {
			return (
				normalized.find((e) => e.from === fromNamespace && e.to === toNamespace) ||
				normalized.find((e) => e.from === fromNamespace && e.to === '*') ||
				normalized.find((e) => e.from === '*' && e.to === toNamespace) ||
				normalized.find((e) => e.from === '*' && e.to === '*') ||
				null
			)
		},

		// run() makes the registry look like a standard transition object so it
		// can be passed directly to runTransition() without any router changes.
		run(payload) {
			const entry = this.resolve({
				fromNamespace: payload.fromNamespace,
				toNamespace: payload.toNamespace,
			})
			if (!entry) return Promise.resolve()
			return callHandler(entry.handler, payload)
		},
	}
}

function callHandler(handler, payload) {
	// Handler can be a plain function or a { run() } object (createTransition output)
	if (typeof handler === 'function') return handler(payload)
	if (typeof handler?.run === 'function') return handler.run(payload)
	return Promise.resolve()
}

function normalizeTransition(entry) {
	if (!entry || (typeof entry !== 'function' && typeof entry !== 'object')) {
		throw new Error('TransitionRegistry: each entry must be a function or object')
	}

	// Bare function shorthand — treated as the default (*->*)
	if (typeof entry === 'function') {
		return { name: entry.name || 'anonymous', from: '*', to: '*', handler: entry }
	}

	// Object shorthand from createTransition() / Transition instances.
	// Treat a top-level { run() } as the default transition handler.
	if (!('handler' in entry) && typeof entry.run === 'function') {
		const { name = 'unnamed', from = '*', to = '*' } = entry
		return { name, from, to, handler: entry }
	}

	const { name = 'unnamed', from = '*', to = '*', handler } = entry

	if (typeof handler !== 'function' && typeof handler?.run !== 'function') {
		throw new Error(
			`TransitionRegistry: transition "${name}" handler must be a function or have a run() method`,
		)
	}

	return { name, from, to, handler }
}
