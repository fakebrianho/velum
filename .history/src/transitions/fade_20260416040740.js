import gsap from 'gsap'

// export const fadeTransition = {
// 	run({ from, to }) {
// 		return new Promise((resolve) => {
// 			const tl = gsap.timeline({ onComplete: resolve })

// 			tl.set(to, { opacity: 0 })
// 			if (from) tl.to(from, { opacity: 0, duration: 0.4 })
// 			tl.to(to, { opacity: 1, duration: 0.6 })
// 		})
// 	},
// }
export function createFadeTransition({
	durationFrom = 0.4,
	durationTo = 0.6,
} = {}) {
	return {
		run({ from, to }) {
			return new Promise((resolve) => {
				const tl = gsap.timeline({ onComplete: resolve })
				tl.set(to, { opacity: 0 })
				if (from) tl.to(from, { opacity: 0, duration: durationFrom })
				tl.to(to, { opacity: 1, duration: durationTo })
			})
		},
	}
}
