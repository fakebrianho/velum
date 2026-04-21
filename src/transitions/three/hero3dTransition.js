import gsap from 'gsap'
import * as THREE from 'three'
import { findPairs, measurePair } from '../../utils/index.js'

/**
 * Create a 3D hero transition that maps matching DOM images to Three.js planes.
 *
 * This transition keeps the existing DOM elements as the layout source of truth:
 * - reads DOMRects from matched elements
 * - projects those rects into perspective camera world-space
 * - animates Three.js planes between the two states
 * - reveals destination DOM elements when complete
 *
 * @param {object} options
 * @param {THREE.Scene} options.scene
 * @param {THREE.PerspectiveCamera} options.camera
 * @param {THREE.WebGLRenderer} options.renderer
 * @param {number} [options.duration=0.7]
 * @param {string} [options.ease='power3.inOut']
 * @param {number} [options.planeZ=0]
 * @param {boolean} [options.fadePages=true]
 * @param {string} [options.heroAttr='data-hero-key']
 * @param {(el: HTMLElement, pair: { fromEl: HTMLElement, toEl: HTMLElement, key: string }) => Promise<THREE.Texture>} [options.createTexture]
 * @param {(ctx: { renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera }) => void} [options.render]
 * @returns {{ run(payload: object): Promise<void> }}
 */
export function createThreeHeroTransition(options) {
	const {
		scene,
		camera,
		renderer,
		duration = 0.7,
		ease = 'power3.inOut',
		planeZ = 0,
		fadePages = true,
		heroAttr = 'data-hero-key',
		createTexture = createTextureFromElement,
		render = ({
			renderer: activeRenderer,
			scene: activeScene,
			camera: activeCamera,
		}) => {
			activeRenderer.render(activeScene, activeCamera)
		},
	} = options || {}

	if (!scene || !camera || !renderer) {
		throw new Error(
			'createThreeHeroTransition: scene, camera, and renderer are required',
		)
	}

	if (!camera.isPerspectiveCamera) {
		throw new Error(
			'createThreeHeroTransition: requires a PerspectiveCamera',
		)
	}

	return {
		async run({ from, to, heroIndex }) {
			const tl = gsap.timeline()

			if (!from) {
				if (fadePages) {
					tl.set(to, { opacity: 0 })
					tl.to(to, { opacity: 1, duration: 0.35, ease }, 0)
				}
				await tl
				return
			}

			const pairs = findPairs(from, heroIndex || to, heroAttr)
			if (!pairs.length) {
				if (fadePages) {
					tl.to(from, { opacity: 0, duration: 0.3, ease }, 0)
					tl.to(to, { opacity: 1, duration: 0.3, ease }, 0.1)
				}
				await tl
				return
			}
			console.log('running at least')
			const meshes = []
			const hiddenElements = []
			const canvasRect = renderer.domElement.getBoundingClientRect()

			for (const pair of pairs) {
				console.log('airs', pair)
				const { fromEl, toEl } = pair
				const { fromRect, toRect } = measurePair(fromEl, toEl, from, to)
				const texture = await createTexture(fromEl, pair)
				console.log('asdf', texture)
				if (!texture) continue

				const material = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true,
					toneMapped: false,
				})
				const mesh = new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					material,
				)
				scene.add(mesh)
				meshes.push(mesh)

				fromEl.style.visibility = 'hidden'
				toEl.style.visibility = 'hidden'
				hiddenElements.push(fromEl, toEl)

				const fromState = rectToWorldState({
					rect: fromRect,
					canvasRect,
					camera,
					planeZ,
				})
				const toState = rectToWorldState({
					rect: toRect,
					canvasRect,
					camera,
					planeZ,
				})

				applyPlaneState(mesh, fromState)

				const tweenState = { ...fromState }
				tl.to(
					tweenState,
					{
						x: toState.x,
						y: toState.y,
						width: toState.width,
						height: toState.height,
						duration,
						ease,
						onUpdate: () => {
							applyPlaneState(mesh, tweenState)
							render({ renderer, scene, camera })
						},
					},
					0,
				)
			}

			if (fadePages) {
				tl.to(
					from,
					{
						opacity: 0,
						duration: Math.min(duration * 0.55, 0.35),
						ease,
					},
					0,
				)
				tl.to(
					to,
					{
						opacity: 1,
						duration: Math.min(duration * 0.55, 0.35),
						ease,
					},
					duration * 0.35,
				)
			}

			tl.add(() => {
				for (const el of hiddenElements) {
					el.style.visibility = ''
				}

				for (const mesh of meshes) {
					scene.remove(mesh)
					mesh.geometry.dispose()
					if (mesh.material?.map) mesh.material.map.dispose()
					mesh.material.dispose()
				}
				console.log('mesh', meshes)
				render({ renderer, scene, camera })
			})

			await tl
		},
	}
}

function rectToWorldState({ rect, canvasRect, camera, planeZ }) {
	const centerX = rect.left - canvasRect.left + rect.width / 2
	const centerY = rect.top - canvasRect.top + rect.height / 2

	const distance = Math.abs(camera.position.z - planeZ)
	const vFov = (camera.fov * Math.PI) / 180
	const worldHeight = 2 * Math.tan(vFov / 2) * distance
	const worldWidth = worldHeight * camera.aspect

	const unitsPerPixelX = worldWidth / canvasRect.width
	const unitsPerPixelY = worldHeight / canvasRect.height

	return {
		x: (centerX - canvasRect.width / 2) * unitsPerPixelX,
		y: -(centerY - canvasRect.height / 2) * unitsPerPixelY,
		width: rect.width * unitsPerPixelX,
		height: rect.height * unitsPerPixelY,
	}
}

function applyPlaneState(mesh, state) {
	mesh.position.set(state.x, state.y, mesh.position.z)
	mesh.scale.set(state.width, state.height, 1)
}

async function createTextureFromElement(el) {
	const src = resolveImageSource(el)
	if (!src) return null

	const loader = new THREE.TextureLoader()
	loader.setCrossOrigin('anonymous')
	const texture = await loader.loadAsync(src)
	texture.colorSpace = THREE.SRGBColorSpace
	texture.minFilter = THREE.LinearFilter
	texture.magFilter = THREE.LinearFilter
	return texture
}

function resolveImageSource(el) {
	if (!el) return null

	if (el instanceof HTMLImageElement) {
		return el.currentSrc || el.src || null
	}

	const img = el.querySelector?.('img')
	return img ? img.currentSrc || img.src || null : null
}
