import { createTransition, tweenRect } from '../utils/transitionUtil.js'
import { findPairs, measurePair, cloneFixed, getRadius } from '../utils/index.js'

export const heroTransition = createTransition(
	({ from, to, tl, heroIndex }) => {
		// 1. Find all matched elements between the two pages
		const pairs = findPairs(from, heroIndex)
		console.log('heroIndex size:', heroIndex?.size)
		console.log(
			'from hero els:',
			from.querySelectorAll('[data-hero-key]').length,
		)
		console.log('pairs:', pairs)

		// 2. For each pair: measure true positions, clone, and fly
		for (const { fromEl, toEl } of pairs) {
			const { fromRect, toRect } = measurePair(fromEl, toEl, from, to)

			// Clone the fromEl and pin it at its current screen position
			const clone = cloneFixed(fromEl, fromRect)

			// Hide the real elements so only the flying clone is visible
			fromEl.style.visibility = 'hidden'
			toEl.style.visibility = 'hidden'

			// Fly the clone from fromRect → toRect on the shared timeline
			tweenRect(clone, fromRect, toRect, tl, {
				duration: 0.6,
				ease: 'power3.inOut',
				borderRadius: getRadius(toEl), // morph border-radius if they differ
			})

			// Clean up the clone and reveal the real destination element
			tl.add(() => {
				clone.remove()
				toEl.style.visibility = ''
			})
		}
		// 3. Fade the page content behind the flying images
		if (from) tl.to(from, { opacity: 0, duration: 0.3 }, 0)
		tl.to(to, { opacity: 1, duration: 0.3 }, 0.35)
	},
)
