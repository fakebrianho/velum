import { createTransition } from '../utils/index.js'

export const aboutToWorkTransition = createTransition(({ from, to, tl }) => {
	tl.set(to, { opacity: 0, y: 16 })
	if (from) tl.to(from, { opacity: 0, duration: 0.25, ease: 'power2.in' })
	tl.to(to, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
})
