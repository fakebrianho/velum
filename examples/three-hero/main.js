import * as THREE from 'three'
import {
	createRouter,
	createThreeHeroTransition,
	defaultFadeTransition,
} from '../../index.js'
import {
	syncingPixel,
	loadImages,
	setImageExposure,
	setImageSaturation,
	syncPlanesToDom,
} from '../../index.js'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { heroTransition } from '../../src/transitions/heroTransition.js'

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	100,
)

const lenis = new Lenis({
	duration: 1.0,
	smoothWheel: true,
})

const planes = []
const perspective = 5
const planeMap = new Map()
const activeTransitionKeys = new Set()

const hero3dTransition = createThreeHeroTransition({
	scene,
	camera,
	renderer,
	duration: 0.75,
	planeZ: 0,
	planeMap,
	activeTransitionKeys,
})

init()
function init() {
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)
	camera.position.z = perspective

	syncingPixel(perspective, camera)
	loadImages(scene, renderer, planes, planeMap)
	setImageExposure(1.0)
	setImageSaturation(1.4)
	window.setImageExposure = setImageExposure
	window.setImageSaturation = setImageSaturation
	resize()
	requestAnimationFrame(animate)
}
function resize() {
	window.addEventListener('resize', () => {
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		renderer.setSize(window.innerWidth, window.innerHeight)
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
	})
}
function animate(time) {
	lenis.raf(time)
	syncPlanesToDom(planes, activeTransitionKeys)
	renderer.render(scene, camera)
	requestAnimationFrame(animate)
}
const router = createRouter({
	routes: ['/', '/about', '/contact'],
	transitions: [
		{
			name: 'home-about-3d',
			from: 'home',
			to: 'about',
			handler: hero3dTransition,
		},
		{
			name: 'home-contact-3d',
			from: 'home',
			to: 'contact',
			handler: hero3dTransition,
		},
		{
			name: 'contact-home-3d',
			from: 'contact',
			to: 'home',
			handler: hero3dTransition,
		},
		{
			name: 'about-home-3d',
			from: 'about',
			to: 'home',
			handler: hero3dTransition,
		},
		defaultFadeTransition,
	],
})

router.start()
