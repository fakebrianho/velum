/**
 * Get the bounding rect of an element.
 */
export function getRect(el) {
	return el.getBoundingClientRect()
}

/**
 * Get the computed border-radius of an element.
 */
export function getRadius(el) {
	return getComputedStyle(el).borderRadius
}

/**
 * Clone an element and pin it at a fixed position over the viewport.
 * Appends to document.body and returns the clone so you can animate it.
 */
export function cloneFixed(el, rect) {
	const clone = el.cloneNode(true)
	Object.assign(clone.style, {
		position: 'fixed',
		top: rect.top + 'px',
		left: rect.left + 'px',
		width: rect.width + 'px',
		height: rect.height + 'px',
		margin: '0',
		borderRadius: getRadius(el),
		pointerEvents: 'none',
		zIndex: '9999',
	})
	document.body.appendChild(clone)
	return clone
}

/**
 * Find all elements in fromContainer that have a matching counterpart in
 * toContainer by a shared data attribute (default: data-hero-key).
 *
 * Returns an array of { key, fromEl, toEl } pairs.
 */
export function findPairs(fromContainer, toContainer, attr = 'data-hero-key') {
	const pairs = []
	fromContainer.querySelectorAll(`[${attr}]`).forEach((fromEl) => {
		const key = fromEl.getAttribute(attr)
		const toEl = toContainer.querySelector(`[${attr}="${key}"]`)
		if (toEl) pairs.push({ key, fromEl, toEl })
	})
	return pairs
}

/**
 * Measure the true fromRect and toRect for a matched element pair.
 *
 * The challenge: during a transition the incoming container (toContainer) is
 * absolutely positioned over the outgoing one, so toEl.getBoundingClientRect()
 * reflects that temporary position rather than where it will end up.
 *
 * This fixes that by briefly hiding fromContainer and restoring toContainer
 * to normal flow before measuring — all synchronously, so no paint happens.
 *
 *   const { fromRect, toRect } = measurePair(fromEl, toEl, from, to)
 */
export function measurePair(fromEl, toEl, fromContainer, toContainer) {
	// Phase 1 — measure fromEl while fromContainer is still in flow
	const fromRect = fromEl.getBoundingClientRect()

	// Phase 2 — hide fromContainer, restore toContainer to normal flow,
	// then measure toEl at its true final position
	fromContainer.style.display = 'none'

	const saved = {
		position: toContainer.style.position,
		top: toContainer.style.top,
		left: toContainer.style.left,
		width: toContainer.style.width,
	}
	Object.assign(toContainer.style, { position: '', top: '', left: '', width: '' })

	const toRect = toEl.getBoundingClientRect()

	// Restore both containers
	fromContainer.style.display = ''
	Object.assign(toContainer.style, saved)


	return { fromRect, toRect }
}
