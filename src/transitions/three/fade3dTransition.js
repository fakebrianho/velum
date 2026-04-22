import gsap from 'gsap'

export function createDefault3DFade({
	planeMap,
	activeTransitionKeys = new Set(),
	duration = 0.5,
	ease = 'power2.inOut',
} = {}) {
	return {
		async run({ from, to, heroIndex }) {
			const tl = gsap.timeline()

			// All planes not locked by an in-flight hero transition
			const freePlanes = [...planeMap.entries()].filter(
				([key, mesh]) => mesh && !activeTransitionKeys.has(key),
			)

			// Fade out current page's visible planes and DOM simultaneously
			const outgoingUniforms = freePlanes
				.map(([, mesh]) => mesh.material?.uniforms?.uAlpha)
				.filter(Boolean)

			if (outgoingUniforms.length) {
				tl.to(outgoingUniforms, { value: 0, duration: duration * 0.5, ease }, 0)
			}
			if (from) {
				tl.to(from, { opacity: 0, duration: duration * 0.5, ease }, 0)
			}

			// Remap planes to incoming page while everything is invisible
			tl.add(() => {
				for (const [key, mesh] of freePlanes) {
					const nextEl = (heroIndex instanceof Map ? heroIndex.get(key) : null) ?? null
					mesh.userData.img = nextEl
					mesh.visible = Boolean(nextEl)
					if (mesh.material?.uniforms?.uAlpha) {
						mesh.material.uniforms.uAlpha.value = 0
					}
				}
			})

			// Fade in incoming page's planes and DOM simultaneously
			const incomingKeys = heroIndex instanceof Map ? heroIndex : new Map()
			const incomingUniforms = freePlanes
				.filter(([key]) => incomingKeys.has(key))
				.map(([, mesh]) => mesh.material?.uniforms?.uAlpha)
				.filter(Boolean)

			if (incomingUniforms.length) {
				tl.to(incomingUniforms, { value: 1, duration: duration * 0.5, ease })
			}
			tl.to(to, { opacity: 1, duration: duration * 0.5, ease }, `-=${duration * 0.5}`)

			await tl
		},
	}
}
