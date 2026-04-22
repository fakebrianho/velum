import { TextureLoader } from 'three'
import * as THREE from 'three'
import vertexShader from '../../shaders/vertex.glsl?raw'
import fragmentShader from '../../shaders/fragment.glsl?raw'
const imageMaterials = []

export const setImageExposure = (value = 1) => {
	const exposure = Math.max(0, Number(value) || 0)
	imageMaterials.forEach((mat) => {
		mat.uniforms.uExposure.value = exposure
	})
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

export const loadImages = (scene, renderer, planes, planeMap) => {
	imageMaterials.length = 0

	document.querySelectorAll('img[data-webgl]').forEach((img) => {
		console.log('sdfa', img.dataset)
		const loader = new TextureLoader()
		const tex = loader.load(img.src)
		// const sz = getContentBoxSize(img)
		const sz = img.getBoundingClientRect()
		tex.colorSpace = THREE.SRGBColorSpace // important, or colors look washed out
		tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
		const geo = new THREE.PlaneGeometry(1, 1, 32, 32)
		const mat = new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: tex },
				uHover: { value: 0 },
				uTime: { value: 0 },
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
		mesh.position.x = sz.left - window.innerWidth / 2 + sz.width / 2
		mesh.position.y = -sz.top + window.innerHeight / 2 - sz.height / 2
		mesh.userData.img = img
		const key = img.dataset.heroKey
		if (key) planeMap.set(key, mesh)
		mesh.userData.key = img.dataset.heroKey
		scene.add(mesh)
		planes.push(mesh)
	})
}
export function syncPlanesToDom(planes, activeTransitionKeys = new Set()) {
	planes.forEach((plane) => {
		const key = plane.userData.key
		if (key && activeTransitionKeys.has(key)) return

		const img = plane.userData.img
		if (!img) return

		const { width, height, top, left } = img.getBoundingClientRect()
		plane.scale.set(width, height, 1)
		plane.position.x = left - window.innerWidth / 2 + width / 2
		plane.position.y = -top + window.innerHeight / 2 - height / 2
	})
}
