import * as THREE from 'three'
import { syncingPixel, loadImages, syncPlanesToDom } from './three-utils.js'

/**
 * Bootstrap a Three.js scene wired for pixel-perfect DOM-synced planes.
 *
 * @param {object} [options]
 * @param {number}  [options.perspective=5]    Camera Z distance (drives pixel-perfect FOV).
 * @param {boolean} [options.antialias=true]
 * @param {boolean} [options.alpha=true]
 * @param {number}  [options.pixelRatio]       Defaults to device pixel ratio capped at 2.
 * @param {number}  [options.near=0.1]
 * @param {number}  [options.far=1000]
 * @param {number}  [options.planeZ=0]
 * @param {(time: number) => void} [options.onTick]  Called every frame before render (e.g. lenis.raf).
 *
 * @returns {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   planes: THREE.Mesh[],
 *   planeMap: Map,
 *   activeTransitionKeys: Set,
 *   planeZ: number,
 *   start(): void,
 * }}
 */
export function createThreeContext({
	perspective = 5,
	antialias = true,
	alpha = true,
	pixelRatio = Math.min(window.devicePixelRatio, 2),
	near = 0.1,
	far = 1000,
	planeZ = 0,
	onTick = null,
} = {}) {
	const renderer = new THREE.WebGLRenderer({ antialias, alpha })
	const scene = new THREE.Scene()
	const camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		near,
		far,
	)

	const planes = []
	const planeMap = new Map()
	const activeTransitionKeys = new Set()

	function start() {
		renderer.setPixelRatio(pixelRatio)
		renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(renderer.domElement)

		syncingPixel(perspective, camera)
		loadImages(scene, renderer, camera, planes, planeMap, planeZ)

		window.addEventListener('resize', () => {
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio))
			renderer.setSize(window.innerWidth, window.innerHeight)
			camera.aspect = window.innerWidth / window.innerHeight
			syncingPixel(perspective, camera)
		})

		requestAnimationFrame(tick)
	}

	function tick(time) {
		onTick?.(time)
		syncPlanesToDom(planes, camera, renderer, activeTransitionKeys, planeZ)
		renderer.render(scene, camera)
		requestAnimationFrame(tick)
	}

	return {
		scene,
		camera,
		renderer,
		planes,
		planeMap,
		activeTransitionKeys,
		planeZ,
		start,
	}
}
