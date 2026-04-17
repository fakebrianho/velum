// lib/velum/transitions/slide.js
import { gsap } from 'gsap'

export async function slideTransition({ from, to }) {
	gsap.set(to, {
		xPercent: 10,
		opacity: 0,
	})

	const tl = gsap.timeline()

	tl.to(
		from,
		{
			xPercent: -10,
			opacity: 0,
			duration: 0.5,
			ease: 'power2.out',
		},
		0,
	)

	tl.to(
		to,
		{
			xPercent: 0,
			opacity: 1,
			duration: 0.5,
			ease: 'power2.out',
		},
		0,
	)

	await tl
}
