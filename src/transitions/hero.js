import gsap from 'gsap'

export function createHeroTransition({
	duration = 0.65,
	ease = 'power3.inOut',
	fadeDuration = 0.35,
} = {}) {
	return {
		run({ from, to, sharedElements }) {
			return new Promise((resolve) => {
				const tl = gsap.timeline({ onComplete: resolve })
				const hasHero =
					sharedElements && Object.keys(sharedElements).length > 0

				if (!hasHero) {
					// No shared elements on this route pair — fall back to a
					// plain crossfade so the transition is never a no-op
					tl.set(to, { opacity: 0 })
					if (from) tl.to(from, { opacity: 0, duration: fadeDuration })
					tl.to(to, { opacity: 1, duration: fadeDuration })
					return
				}

				const clones = []

				for (const { from: fromEl, to: toEl, fromRect, toRect } of Object.values(sharedElements)) {
					// Clone the from element and pin it at its exact viewport
					// position using fixed positioning so it floats above both
					// containers during the animation
					const clone = fromEl.cloneNode(true)
					const fromStyle = getComputedStyle(fromEl)

					gsap.set(clone, {
						position: 'fixed',
						top: fromRect.top,
						left: fromRect.left,
						width: fromRect.width,
						height: fromRect.height,
						margin: 0,
						zIndex: 9999,
						pointerEvents: 'none',
						borderRadius: fromStyle.borderRadius,
					})

					document.body.appendChild(clone)
					clones.push(clone)

					// Hide the real elements — the clone stands in for both
					// during the animation
					gsap.set(fromEl, { opacity: 0 })
					gsap.set(toEl, { opacity: 0 })

					const toStyle = getComputedStyle(toEl)

					// Animate the clone from its old rect to the new one.
					// top/left/width/height are intentional here — transform
					// scale would require extra math to keep the element
					// anchored correctly across different aspect ratios.
					tl.to(
						clone,
						{
							top: toRect.top,
							left: toRect.left,
							width: toRect.width,
							height: toRect.height,
							borderRadius: toStyle.borderRadius,
							duration,
							ease,
						},
						0
					)
				}

				// Fade the non-hero content of the outgoing container out
				// quickly at the start so attention stays on the hero
				if (from) {
					tl.to(from, { opacity: 0, duration: fadeDuration }, 0)
				}

				// Fade the incoming container in during the second half so
				// its non-hero content appears as the hero lands
				tl.set(to, { opacity: 0 })
				tl.to(
					to,
					{ opacity: 1, duration: fadeDuration },
					duration - fadeDuration
				)

				// Once the timeline is done: remove clones and reveal the
				// real destination hero element
				tl.add(() => {
					clones.forEach((c) => c.remove())
					for (const { to: toEl } of Object.values(sharedElements)) {
						gsap.set(toEl, { opacity: 1 })
					}
				})
			})
		},
	}
}
