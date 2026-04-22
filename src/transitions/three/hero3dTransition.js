import gsap from 'gsap'
import * as THREE from 'three'
import { findPairs, measurePair, cloneFixed } from '../../utils/index.js'
import { rectToWorldState } from '../../utils/three-utils.js'

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
		planeMap,
		activeTransitionKeys = new Set(),
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

	let killActive = null

	return {
		async run({ from, to, heroIndex }) {
			killActive?.()

			const tl = gsap.timeline()
			let settle
			const settled = new Promise((r) => {
				settle = r
			})
			tl.then(settle)
			killActive = () => {
				tl.kill()
				settle()
			}

			if (!from) {
				if (fadePages) {
					tl.set(to, { opacity: 0 })
					tl.to(to, { opacity: 1, duration: 0.35, ease }, 0)
				}
				await settled
				killActive = null
				return
			}

			const pairs = findPairs(from, heroIndex || to, heroAttr)

			if (!pairs.length) {
				if (fadePages) {
					tl.to(from, { opacity: 0, duration: 0.3, ease }, 0)
					tl.to(to, { opacity: 1, duration: 0.3, ease }, 0.1)
				}
				tl.add(() => {
					reconcilePlanesToIncomingPage({ planeMap, heroIndex })
				})
				await settled
				killActive = null
				return
			}
			const { key: activeKey, fromEl, toEl } = pairs[0]
			const otherReturningMeshes = [...planeMap.entries()]
				.filter(
					([key]) =>
						key !== activeKey &&
						heroIndex instanceof Map &&
						heroIndex.has(key),
				)
				.map(([key, mesh]) => ({
					key,
					mesh,
					nextEl: heroIndex.get(key),
					uniform: mesh?.material?.uniforms?.uAlpha,
				}))
				.filter((entry) =>
					Boolean(entry.mesh && entry.uniform && entry.nextEl),
				)
			const otherReturningAlphaUniforms = otherReturningMeshes.map(
				(entry) => entry.uniform,
			)
			const returningKeySet = new Set(
				otherReturningMeshes.map((entry) => entry.key),
			)
			const otherFadingOutUniforms = [...planeMap.entries()]
				.filter(
					([key]) => key !== activeKey && !returningKeySet.has(key),
				)
				.map(([, mesh]) => mesh?.material?.uniforms?.uAlpha)
				.filter(Boolean)

			if (otherFadingOutUniforms.length) {
				tl.to(
					otherFadingOutUniforms,
					{
						value: 0,
						duration,
					},
					0,
				)
			}
			const canvasRect = renderer.domElement.getBoundingClientRect()
			const target = rectToWorldState({ rect: toEl.getBoundingClientRect(), canvasRect, camera, planeZ })
			activeTransitionKeys.add(activeKey)
			try {
				const mesh = planeMap.get(activeKey)
				if (!mesh) {
					tl.add(() => reconcilePlanesToIncomingPage({ planeMap, heroIndex }))
					await settled
					return
				}
				mesh.visible = true
				if (mesh.material?.uniforms?.uAlpha) {
					mesh.material.uniforms.uAlpha.value = 1
				}
				otherReturningMeshes.forEach(({ mesh: returningMesh, nextEl }) => {
					returningMesh.userData.img = nextEl
					returningMesh.visible = true
				})
				tl.to(
					mesh.position,
					{
						x: target.x,
						y: target.y,
						duration,
					},
					0,
				)
				tl.to(
					mesh.scale,
					{
						x: target.width,
						y: target.height,
						duration,
					},
					0,
				)

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
				if (otherReturningAlphaUniforms.length) {
					tl.to(
						otherReturningAlphaUniforms,
						{
							value: 1,
							duration: Math.min(duration * 0.45, 0.3),
							ease,
						},
						duration * 0.55,
					)
				}

				tl.add(() => {
					mesh.userData.img = toEl
					toEl.style.visibility = ''
					fromEl.style.visibility = ''
					reconcilePlanesToIncomingPage({
						planeMap,
						heroIndex,
						resetAlpha: false,
					})
				})
				await settled
			} finally {
				killActive = null
				activeTransitionKeys.delete(activeKey)
			}
		},
	}
}

function reconcilePlanesToIncomingPage({
	planeMap,
	heroIndex,
	resetAlpha = true,
}) {
	if (!(heroIndex instanceof Map)) return

	for (const [key, mesh] of planeMap.entries()) {
		if (!mesh) continue
		const nextEl = heroIndex.get(key) || null
		mesh.userData.img = nextEl
		mesh.visible = Boolean(nextEl)
		if (mesh.material?.uniforms?.uAlpha) {
			if (!nextEl) {
				mesh.material.uniforms.uAlpha.value = 0
			} else if (resetAlpha) {
				mesh.material.uniforms.uAlpha.value = 1
			}
		}
	}
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
