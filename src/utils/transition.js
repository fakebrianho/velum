import gsap from 'gsap'

/**
 * Reduce the run/Promise/timeline boilerplate for writing transitions.
 *
 * Pass a function that receives the standard transition payload plus a
 * pre-wired GSAP timeline. The Promise resolves automatically when the
 * timeline finishes.
 *
 *   export const homeToAbout = createTransition(({ from, to, tl }) => {
 *     tl.set(to, { opacity: 0, y: 16 })
 *     if (from) tl.to(from, { opacity: 0, duration: 0.25 })
 *     tl.to(to, { opacity: 1, y: 0, duration: 0.5 })
 *   })
 */
export function createTransition(fn) {
	return {
		run(payload) {
			return new Promise((resolve) => {
				const tl = gsap.timeline({ onComplete: resolve })
				fn({ ...payload, tl })
			})
		},
	}
}

/**
 * Animate an element between two DOMRects on an existing GSAP timeline.
 * Useful for flying a clone from its origin position to its destination.
 *
 * Applies fixed positioning at fromRect, then tweens to toRect.
 *
 *   const clone = cloneFixed(fromEl, fromRect)
 *   tweenRect(clone, fromRect, toRect, tl)
 *   tl.add(() => clone.remove())
 *
 * @param {HTMLElement} el        - Element to animate (typically a clone)
 * @param {DOMRect}     fromRect  - Starting rect
 * @param {DOMRect}     toRect    - Ending rect
 * @param {GSAPTimeline} tl       - Timeline to add the tween to
 * @param {object}      [options]
 * @param {number}      [options.duration=0.65]
 * @param {string}      [options.ease='power3.inOut']
 * @param {string}      [options.borderRadius] - Target border-radius (if morphing)
 * @param {number|string} [options.at=0]       - Timeline position label/offset
 */
export function tweenRect(el, fromRect, toRect, tl, options = {}) {
	const { duration = 0.65, ease = 'power3.inOut', borderRadius, at = 0 } = options

	gsap.set(el, {
		position: 'fixed',
		top: fromRect.top,
		left: fromRect.left,
		width: fromRect.width,
		height: fromRect.height,
		margin: 0,
		zIndex: 9999,
		pointerEvents: 'none',
	})

	tl.to(
		el,
		{
			top: toRect.top,
			left: toRect.left,
			width: toRect.width,
			height: toRect.height,
			...(borderRadius !== undefined && { borderRadius }),
			duration,
			ease,
		},
		at,
	)
}
