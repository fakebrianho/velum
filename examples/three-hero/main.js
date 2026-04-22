import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
	createThreeContext,
	createThreeHeroTransition,
	createDefault3DFade,
	createRouter,
	setImageExposure,
	setImageSaturation,
} from '../../index.js'

const lenis = new Lenis({ duration: 1.0, smoothWheel: true })

const ctx = createThreeContext({
	perspective: 5,
	onTick: (time) => lenis.raf(time),
})

const hero3dTransition = createThreeHeroTransition({ ...ctx, duration: 0.75 })
const fade3DTransition = createDefault3DFade(ctx)

const router = createRouter({
	routes: ['/', '/about', '/contact'],
	transitions: [
		{ name: 'home-about-3d', from: 'home', to: 'about', handler: hero3dTransition },
		{ name: 'home-contact-3d', from: 'home', to: 'contact', handler: hero3dTransition },
		{ name: 'contact-home-3d', from: 'contact', to: 'home', handler: hero3dTransition },
		{ name: 'about-home-3d', from: 'about', to: 'home', handler: hero3dTransition },
		fade3DTransition,
	],
})

ctx.start()
router.start()

setImageExposure(1.0)
setImageSaturation(1.4)
