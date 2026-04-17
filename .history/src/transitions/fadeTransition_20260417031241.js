// lib/velum/transitions/fade.js
import { gsap } from 'gsap'

export async function fadeTransition({ from, to }) {
	await gsap.to(from, {
		opacity: 0,
		duration: 0.4,
		ease: 'power2.out',
	})

	await gsap.to(to, {
		opacity: 1,
		duration: 0.4,
		ease: 'power2.out',
	})
}
