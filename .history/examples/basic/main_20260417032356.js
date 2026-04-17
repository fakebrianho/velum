import gsap from 'gsap'
import {
	createRouter,
	homeToAboutTransition,
	aboutToWorkTransition,
	defaultFadeTransition,
	fadeTransition,
	slideTransition,
} from '../../index.js'

const transitions = [
	{
		name: 'home-to-about',
		from: ['home'],
		to: ['about'],
		handler: homeToAboutTransition,
	},
	{
		name: 'about-to-work',
		from: ['about'],
		to: ['work'],
		handler: aboutToWorkTransition,
	},
	{ name: 'default-fade', handler: defaultFadeTransition },
]

// const router = createRouter({
// 	transitions,
// 	routes: {
// 		'/': {
// 			namespace: 'home',
// 			onEnter({ container }) {
// 				return gsap.from(container.querySelectorAll('[data-animate]'), {
// 					y: 20,
// 					opacity: 0,
// 					duration: 0.6,
// 					stagger: 0.08,
// 					ease: 'power3.out',
// 				})
// 			},
// 		},
// 		'/about': {
// 			namespace: 'about',
// 			onEnter({ container }) {
// 				return gsap.from(container.querySelectorAll('[data-animate]'), {
// 					y: 24,
// 					opacity: 0,
// 					duration: 0.7,
// 					stagger: 0.09,
// 					ease: 'expo.out',
// 				})
// 			},
// 		},
// 	},
// })

// router.start()

const router = createRouter({
	routes: {
		'/': {
			namespace: 'home',
		},
		'/about': {
			namespace: 'about',
		},
		'/work': {
			namespace: 'work',
		},
		'/project': {
			namespace: 'project',
		},
	},
	transitions: [
		{
			name: 'home-about',
			from: 'home',
			to: 'about',
			handler: fadeTransition,
		},
		{
			name: 'work-project',
			from: 'home',
			to: 'contact',
			handler: slideTransition,
		},
		{
			name: 'default',
			from: '*',
			to: '*',
			handler: fadeTransition,
		},
	],
})

router.start()
