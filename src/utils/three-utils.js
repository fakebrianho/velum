import { TextureLoader } from 'three'
import * as THREE from 'three'
import vertexShader from '../../shaders/vertex.glsl?raw'
import fragmentShader from '../../shaders/fragment.glsl?raw'
const imageMaterials = []

export function hideWebGLImages(attr = 'data-webgl') {
	if (document.querySelector(`style[data-webgl-hide="${attr}"]`)) return
	const style = document.createElement('style')
	style.setAttribute('data-webgl-hide', attr)
	style.textContent = `img[${attr}] { visibility: hidden; }`
	document.head.appendChild(style)
}

export function rectToWorldState({ rect, canvasRect, camera, planeZ = 0 }) {
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

export const setImageExposure = (value = 1) => {
	const exposure = Math.max(0, Number(value) || 0)
	imageMaterials.forEach((mat) => {
		mat.uniforms.uExposure.value = exposure
	})
}

export const replaceIMG = () => {
	//
}

export const setImageSaturation = (value = 1) => {
	const saturation = Math.max(0, Number(value) || 0)
	imageMaterials.forEach((mat) => {
		mat.uniforms.uSaturation.value = saturation
	})
}

export const syncingPixel = (perspective, camera) => {
	const fov =
		2 * Math.atan(window.innerHeight / 2 / perspective) * (180 / Math.PI)
	camera.fov = fov
	camera.position.z = perspective
	camera.updateProjectionMatrix()
}

const getContentBoxSize = (img) => {
	const rect = img.getBoundingClientRect()
	const styles = window.getComputedStyle(img)
	const paddingX =
		parseFloat(styles.paddingLeft || 0) +
		parseFloat(styles.paddingRight || 0)
	const paddingY =
		parseFloat(styles.paddingTop || 0) +
		parseFloat(styles.paddingBottom || 0)
	const borderX =
		parseFloat(styles.borderLeftWidth || 0) +
		parseFloat(styles.borderRightWidth || 0)
	const borderY =
		parseFloat(styles.borderTopWidth || 0) +
		parseFloat(styles.borderBottomWidth || 0)

	return {
		width: Math.max(1, rect.width - paddingX - borderX),
		height: Math.max(1, rect.height - paddingY - borderY),
	}
}

export const loadImages = (scene, renderer, camera, planes, planeMap, planeZ = 0) => {
	hideWebGLImages()
	imageMaterials.length = 0
	const canvasRect = renderer.domElement.getBoundingClientRect()
	document.querySelectorAll('img[data-webgl]').forEach((img) => {
		const loader = new TextureLoader()
		const tex = loader.load(img.currentSrc || img.src)
		tex.colorSpace = THREE.SRGBColorSpace
		tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
		const geo = new THREE.PlaneGeometry(1, 1, 1, 1)
		const mat = new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: tex },
				uExposure: { value: 0.95 },
				uSaturation: { value: 1.0 },
				uAlpha: { value: 1.0 },
			},
			transparent: true,
			vertexShader,
			fragmentShader,
			toneMapped: false,
		})
		imageMaterials.push(mat)
		const mesh = new THREE.Mesh(geo, mat)
		const state = rectToWorldState({ rect: img.getBoundingClientRect(), canvasRect, camera, planeZ })
		mesh.position.set(state.x, state.y, planeZ)
		mesh.scale.set(state.width, state.height, 1)
		mesh.userData.img = img
		const key = img.dataset.heroKey
		if (key) planeMap.set(key, mesh)
		mesh.userData.key = key
		scene.add(mesh)
		planes.push(mesh)
	})
}

export function syncPlanesToDom(planes, camera, renderer, activeTransitionKeys = new Set(), planeZ = 0) {
	const canvasRect = renderer.domElement.getBoundingClientRect()
	planes.forEach((plane) => {
		const key = plane.userData.key
		if (key && activeTransitionKeys.has(key)) return

		const img = plane.userData.img
		if (!img) return

		const state = rectToWorldState({ rect: img.getBoundingClientRect(), canvasRect, camera, planeZ })
		plane.scale.set(state.width, state.height, 1)
		plane.position.x = state.x
		plane.position.y = state.y
	})
}
