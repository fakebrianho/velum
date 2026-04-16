import * as THREE from 'three'
import gsap from 'gsap'

const vertexShader = `
uniform float uProgress;
varying vec2 vUv;

void main() {
	vUv = uv;
	vec3 pos = position;

	// Envelope: 0 at start and end, peaks at midpoint
	float envelope = sin(uProgress * 3.14159);

	// Radial twist — corners rotate ~230 deg at peak, centre stays fixed
	float dist = length(position.xy);
	float angle = envelope * dist * 8.0;
	float c = cos(angle);
	float s = sin(angle);
	pos.x = position.x * c - position.y * s;
	pos.y = position.x * s + position.y * c;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
precision mediump float;

uniform float uProgress;
varying vec2 vUv;

void main() {
	vec2 uv = vUv;

	// Swirl UVs to match the vertex twist
	float warp = sin(uProgress * 3.14159);
	vec2 centre = uv - 0.5;
	float dist = length(centre);
	float angle = warp * dist * 6.0;
	float c = cos(angle);
	float s = sin(angle);
	centre = vec2(centre.x * c - centre.y * s, centre.x * s + centre.y * c);
	uv = centre + 0.5;

	// Match CSS: linear-gradient(135deg, #3b1fa8 0%, #7b3fe4 40%, #e0608a 75%, #f5a623 100%)
	vec3 c0 = vec3(0.231, 0.122, 0.659);
	vec3 c1 = vec3(0.482, 0.247, 0.894);
	vec3 c2 = vec3(0.878, 0.376, 0.541);
	vec3 c3 = vec3(0.961, 0.651, 0.137);

	float t = clamp((uv.x + (1.0 - uv.y)) * 0.5, 0.0, 1.0);

	vec3 color;
	if (t < 0.4) {
		color = mix(c0, c1, t / 0.4);
	} else if (t < 0.75) {
		color = mix(c1, c2, (t - 0.4) / 0.35);
	} else {
		color = mix(c2, c3, (t - 0.75) / 0.25);
	}

	gl_FragColor = vec4(color, 1.0);
}
`

function domRectToThree(rect) {
	return {
		x: rect.left + rect.width / 2 - window.innerWidth / 2,
		y: -(rect.top + rect.height / 2 - window.innerHeight / 2),
		w: rect.width,
		h: rect.height,
	}
}

function makeCamera() {
	const cam = new THREE.OrthographicCamera(
		-window.innerWidth / 2,
		window.innerWidth / 2,
		window.innerHeight / 2,
		-window.innerHeight / 2,
		0.1,
		100
	)
	cam.position.z = 10
	return cam
}

export function createShaderHeroTransition({
	duration = 0.7,
	ease = 'power3.inOut',
	fadeDuration = 0.3,
} = {}) {
	// Set up Three.js once — the transition owns its canvas, renderer,
	// scene, and RAF loop so there is no external wiring required.
	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setSize(window.innerWidth, window.innerHeight)

	Object.assign(renderer.domElement.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100%',
		height: '100%',
		pointerEvents: 'none',
		zIndex: '9999',
	})
	document.body.appendChild(renderer.domElement)

	const scene = new THREE.Scene()
	let camera = makeCamera()

	window.addEventListener('resize', () => {
		renderer.setSize(window.innerWidth, window.innerHeight)
		camera = makeCamera()
	})

	;(function tick() {
		requestAnimationFrame(tick)
		renderer.render(scene, camera)
	})()

	return {
		run({ from, to, sharedElements }) {
			return new Promise((resolve) => {
				const hasHero =
					sharedElements && Object.keys(sharedElements).length > 0

				if (!hasHero) {
					const tl = gsap.timeline({ onComplete: resolve })
					gsap.set(to, { opacity: 0 })
					if (from) tl.to(from, { opacity: 0, duration: fadeDuration })
					tl.to(to, { opacity: 1, duration: fadeDuration })
					return
				}

				const tl = gsap.timeline({
					onComplete: resolve,
				})

				const meshes = []

				for (const {
					from: fromEl,
					to: toEl,
					fromRect,
					toRect,
				} of Object.values(sharedElements)) {
					const fromThree = domRectToThree(fromRect)
					const toThree = domRectToThree(toRect)

					const material = new THREE.ShaderMaterial({
						vertexShader,
						fragmentShader,
						uniforms: { uProgress: { value: 0 } },
						depthTest: false,
						depthWrite: false,
					})

					// 32×32 segments so the twist has enough vertices to resolve
					const geometry = new THREE.PlaneGeometry(1, 1, 32, 32)
					const mesh = new THREE.Mesh(geometry, material)
					mesh.renderOrder = 999
					mesh.position.set(fromThree.x, fromThree.y, 0)
					mesh.scale.set(fromThree.w, fromThree.h, 1)
					scene.add(mesh)
					meshes.push({ mesh, material, toEl })

					gsap.set(fromEl, { opacity: 0 })
					gsap.set(toEl, { opacity: 0 })

					const proxy = {
						x: fromThree.x,
						y: fromThree.y,
						w: fromThree.w,
						h: fromThree.h,
						progress: 0,
					}

					// All tweens on the same timeline so onComplete fires
					// only after every animation is finished
					tl.to(
						proxy,
						{
							x: toThree.x,
							y: toThree.y,
							w: toThree.w,
							h: toThree.h,
							progress: 1,
							duration,
							ease,
							onUpdate() {
								mesh.position.set(proxy.x, proxy.y, 0)
								mesh.scale.set(proxy.w, proxy.h, 1)
								material.uniforms.uProgress.value = proxy.progress
								console.log('progressla,', material.uniforms.uProgress.value)
							},
						},
						0
					)
				}

				gsap.set(to, { opacity: 0 })
				if (from) tl.to(from, { opacity: 0, duration: fadeDuration }, 0)
				tl.to(
					to,
					{ opacity: 1, duration: fadeDuration },
					duration - fadeDuration
				)

				// Cleanup after all tweens complete (onComplete fires here)
				tl.add(() => {
					meshes.forEach(({ mesh, material, toEl }) => {
						scene.remove(mesh)
						mesh.geometry.dispose()
						material.dispose()
						gsap.set(toEl, { opacity: 1 })
					})
				})
			})
		},
	}
}
