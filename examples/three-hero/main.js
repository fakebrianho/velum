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

const hero3dTransition = createThreeHeroTransition({
	scene,
	camera,
	renderer,
	duration: 0.75,
	planeZ: 0,
})
const planes = []
const perspective = 5
init()
function init() {
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)
	camera.position.z = perspective

	syncingPixel(perspective, camera)
	loadImages(scene, renderer, planes)
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

		// planes.forEach((plane) => {
		// 	const { width, height, top, left } =
		// 		plane.userData.img.getBoundingClientRect()
		// 	plane.scale.set(width, height, 1)
		// 	plane.position.x = left - window.innerWidth / 2 + width / 2
		// 	plane.position.y = -top + window.innerHeight / 2 - height / 2
		// })
		camera.updateProjectionMatrix()
	})
}
function animate(time) {
	lenis.raf(time)
	syncPlanesToDom(planes)
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
		defaultFadeTransition,
	],
})

router.start()
