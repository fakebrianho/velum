import gsap from 'gsap'

/**
 * Base class for building page transitions.
 *
 * Extend this class and override the `animate` method (required) plus
 * optional lifecycle hooks `before` and `after`. The instance is
 * compatible with the library's `{ run(payload) }` interface, so it
 * can be passed anywhere a transition object is expected.
 *
 * @example
 * class SlideUp extends Transition {
 *   before({ to }) {
 *     gsap.set(to, { yPercent: 100, opacity: 0 })
 *   }
 *
 *   animate({ from, to, tl }) {
 *     if (from) tl.to(from, { yPercent: -100, opacity: 0, duration: this.duration })
 *     tl.to(to, { yPercent: 0, opacity: 1, duration: this.duration }, '<')
 *   }
 * }
 *
 * export const slideUp = new SlideUp({ duration: 0.5 })
 */
export class Transition {
	/**
	 * @param {object} [options]
	 * @param {number} [options.duration=0.4]  - Default tween duration in seconds
	 * @param {string} [options.ease='power2.inOut'] - Default GSAP ease
	 */
	constructor({ duration = 0.4, ease = 'power2.inOut' } = {}) {
		this.duration = duration
		this.ease = ease
	}

	/**
	 * Called synchronously before the timeline starts.
	 * Use this to set initial states (gsap.set, class toggles, etc.).
	 *
	 * @param {{ from: HTMLElement|null, to: HTMLElement }} payload
	 */
	// eslint-disable-next-line no-unused-vars
	before(payload) {}

	/**
	 * Build the animation on the provided GSAP timeline.
	 * This is the primary method to override in subclasses.
	 *
	 * @param {{ from: HTMLElement|null, to: HTMLElement, tl: GSAPTimeline }} payload
	 */
	// eslint-disable-next-line no-unused-vars
	animate(payload) {
		throw new Error(`${this.constructor.name}: animate() must be implemented`)
	}

	/**
	 * Called after the timeline completes.
	 * Use this for cleanup (removing inline styles, resetting classes, etc.).
	 *
	 * @param {{ from: HTMLElement|null, to: HTMLElement }} payload
	 */
	// eslint-disable-next-line no-unused-vars
	after(payload) {}

	/**
	 * Runs the full transition lifecycle.
	 * Compatible with the library's { run(payload) } interface.
	 *
	 * @param {{ from: HTMLElement|null, to: HTMLElement }} payload
	 * @returns {Promise<void>}
	 */
	run(payload) {
		this.before(payload)

		return new Promise((resolve) => {
			const tl = gsap.timeline({
				onComplete: () => {
					this.after(payload)
					resolve()
				},
			})

			this.animate({ ...payload, tl })
		})
	}
}
