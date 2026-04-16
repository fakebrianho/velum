import gsap from 'gsap'
import {
	createHeroTransition,
	createRouter,
	createShaderHeroTransition,
} from '../../index.js'

const router = createRouter({
	transition: createHeroTransition({
		duration: 0.7,
		ease: 'power3.inOut',
		fadeDuration: 0.3,
	}),

	routes: {
		'/': {
			namespace: 'home',
			onEnter({ container, sharedFlipKeys }) {
				// Skip blocks that include a shared hero target — the transition
				// already carried that element; animating the parent (e.g. the
				// whole card with data-animate) would re-fade the hero and feel
				// like the page loads twice.
				const keys = sharedFlipKeys || []
				const targets = [...container.querySelectorAll('[data-animate]')].filter(
					(el) =>
						!keys.some((key) => el.querySelector(`[data-flip-key="${key}"]`)),
				)
				if (!targets.length) return
				return gsap.from(targets, {
					y: 20,
					opacity: 0,
					duration: 0.6,
					stagger: 0.08,
					ease: 'power3.out',
				})
			},
		},
		'/about': {
			namespace: 'about',
			onEnter({ container }) {
				return gsap.from(container.querySelectorAll('[data-animate]'), {
					y: 24,
					opacity: 0,
					duration: 0.7,
					stagger: 0.09,
					ease: 'expo.out',
				})
			},
		},
	},
})

router.start()
