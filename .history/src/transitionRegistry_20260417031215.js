// /**
//  * createTransitionRegistry
//  *
//  * Builds a transition-compatible object from a prioritized list of entries.
//  * The returned object has a run() method so it can be passed directly as the
//  * router's `transition` option — no router changes needed.
//  *
//  * Entry shape:
//  *   {
//  *     name:    string           — optional, for debugging
//  *     from:    string[]         — namespaces this entry matches as the source
//  *     to:      string[]         — namespaces this entry matches as the destination
//  *     handler: { run(payload) } — the actual transition to execute
//  *   }
//  *
//  * Matching rules (first match wins):
//  *   - Both `from` and `to` present: both must match
//  *   - Only `from`: matches any destination from those sources
//  *   - Only `to`: matches any source going to those destinations
//  *   - Neither: acts as the default fallback
//  *
//  * Usage:
//  *   const registry = createTransitionRegistry([
//  *     { name: 'home-to-about', from: ['home'], to: ['about'], handler: heroTransition },
//  *     { name: 'default',       handler: fadeTransition },
//  *   ])
//  *
//  *   createRouter({ transition: registry, ... })
//  */
// export function createTransitionRegistry(entries) {
// 	const specific = entries.filter((e) => e.from?.length || e.to?.length)
// 	const fallback = entries.find((e) => !e.from?.length && !e.to?.length)

// 	return {
// 		run(payload) {
// 			const fromNs = payload.fromRoute?.namespace ?? null
// 			const toNs = payload.toRoute?.namespace ?? null

// 			const match = specific.find((entry) => {
// 				const fromMatch = !entry.from?.length || (fromNs !== null && entry.from.includes(fromNs))
// 				const toMatch = !entry.to?.length || (toNs !== null && entry.to.includes(toNs))
// 				return fromMatch && toMatch
// 			})

// 			const resolved = match ?? fallback

// 			if (!resolved) return Promise.resolve()
// 			return resolved.handler.run(payload)
// 		},
// 	}
// }
