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
 * Index all elements in a container that carry a shared data attribute
 * (default: data-hero-key) into a Map keyed by that attribute's value.
 *
 * Pre-computing this once — e.g. when a page is first fetched — means
 * subsequent findPairs calls skip the querySelectorAll entirely.
 *
 *   const index = buildIndex(toContainer)
 *   // later, at transition time:
 *   const pairs = findPairs(fromContainer, index)
 */
export function buildIndex(container, attr = 'data-hero-key') {
	const index = new Map()
	container.querySelectorAll(`[${attr}]`).forEach((el) => {
		index.set(el.getAttribute(attr), el)
	})
	return index
}

/**
 * Find all elements in fromContainer that have a matching counterpart in
 * toContainer by a shared data attribute (default: data-hero-key).
 *
 * `toContainerOrIndex` can be either:
 *   - An HTMLElement  — index is built on the fly (convenient, one-shot use)
 *   - A Map           — pre-built via buildIndex() (zero querySelector overhead)
 *
 * Returns an array of { key, fromEl, toEl } pairs.
 */
export function findPairs(fromContainer, toContainerOrIndex, attr = 'data-hero-key') {
	const toIndex =
		toContainerOrIndex instanceof Map
			? toContainerOrIndex
			: buildIndex(toContainerOrIndex, attr)

	const pairs = []
	fromContainer.querySelectorAll(`[${attr}]`).forEach((fromEl) => {
		const key = fromEl.getAttribute(attr)
		const toEl = toIndex.get(key)
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
