import gsap from 'gsap'
import { createRouter, createShaderHeroTransition } from '../../index.js'

const router = createRouter({
	transition: c({
		duration: 0.7,
		ease: 'power3.inOut',
		fadeDuration: 0.3,
	}),

	routes: {
		'/': {
			namespace: 'home',
			onEnter({ container }) {
				return gsap.from(container.querySelectorAll('[data-animate]'), {
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
