// lib/velum/transition.js

/**
 * A transition receives:
 * - from: HTMLElement | null (can be null on first load)
 * - to:   HTMLElement
 * - context: { fromRoute, toRoute, direction }
 * Must return a Promise that resolves when animation is done.
 */
export async function runTransition(transition, payload) {
	if (!transition || typeof transition.run !== 'function') {
		// No-op if no transition provided
		return
	}
	return transition.run(payload)
}
