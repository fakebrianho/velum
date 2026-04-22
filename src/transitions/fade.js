import { createTransition } from '../utils/index.js'

export const defaultFadeTransition = createTransition(({ from, to, tl }) => {
	tl.set(to, { opacity: 0 })
	if (from) tl.to(from, { opacity: 0, duration: 0.3 })
	tl.to(to, { opacity: 1, duration: 0.4 })
})
