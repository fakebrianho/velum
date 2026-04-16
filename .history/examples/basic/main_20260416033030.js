// import { createRouter, fadeTransition } from '../../index.js'
// import gsap from 'gsap'

// createRouter({
// 	containerSelector: '[data-velum-view]',
// 	linkSelector: "a[href^='/']",
// 	transition: fadeTransition,
// 	routes: {
// 		'/': {
// 			namespace: 'home',
// 			onEnter({ container }) {
// 				return gsap.from(container.children, {
// 					y: 20,
// 					opacity: 0,
// 					stagger: 0.05,
// 				})
// 			},
// 		},
// 		'/about': {
// 			namespace: 'about',
// 		},
// 	},
// }).start()
import gsap from 'gsap'
import { createRouter, fadeTransition } from '../../index.js'
// or "../../../src/router.js" during dev

const router = createRouter({
	containerSelector: '[data-router-view]',
	linkSelector: "a[href^='/']",
	transition: fadeTransition,

	routes: {
		'/': {
			namespace: 'home',
			// onEnter({ container }) {
			// 	return gsap.from(container.querySelectorAll('[data-animate]'), {
			// 		y: 20,
			// 		opacity: 0,
			// 		duration: 0.6,
			// 		stagger: 0.05,
			// 		ease: 'power3.out',
			// 	})
			// },
			// onLeave({ container }) {
			// 	return gsap.to(container.querySelectorAll('[data-animate]'), {
			// 		y: -20,
			// 		opacity: 0,
			// 		duration: 0.3,
			// 		stagger: 0.05,
			// 		ease: 'power2.in',
			// 	})
			// },
		},

		'/about': {
			namespace: 'about',
			// onEnter({ container }) {
			// 	return gsap.from(container.querySelectorAll('[data-animate]'), {
			// 		y: 30,
			// 		opacity: 0,
			// 		duration: 0.8,
			// 		stagger: 0.07,
			// 		ease: 'expo.out',
			// 	})
			// },
		},
	},
})

router.start()
