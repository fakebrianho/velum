import gsap from 'gsap'
import {
	createRouter,
	homeToAboutTransition,
	aboutToWorkTransition,
	defaultFadeTransition,
	fadeTransition,
	slideTransition,
} from '../../index.js'
import { heroTransition } from '../../src/transitions/heroTransition.js'

const router = createRouter({
	routes: ['/', '/about', '/work', '/project', '/contact'],
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
			name: 'about-contact',
			from: 'about',
			to: 'contact',
			handler: heroTransition,
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
