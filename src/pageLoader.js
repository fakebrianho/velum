// lib/velum/pageLoader.js
import { buildIndex } from './utils/dom.js'

export class PageLoader {
	/**
	 * @param {object} options
	 * @param {string} options.containerSelector  - CSS selector for the router view container
	 * @param {string} [options.heroAttr='data-hero-key'] - Attribute used to match hero elements
	 */
	constructor({ containerSelector, heroAttr = 'data-hero-key' }) {
		this.containerSelector = containerSelector
		this.heroAttr = heroAttr
		this._cache = new Map() // url → { html, namespace, title }
	}

	/**
	 * Load a page by URL.
	 *
	 * After the first fetch, the raw HTML is cached so subsequent calls cost
	 * zero network round-trips. A fresh container element is parsed from the
	 * cached HTML on every call — this prevents stale GSAP inline styles from
	 * a prior navigation bleeding into the next one.
	 *
	 * @param {string} url
	 * @returns {Promise<LoadedPage>}
	 */
	async load(url) {
		if (!this._cache.has(url)) {
			await this._fetch(url)
		}

		return this._parse(url)
	}

	/**
	 * Fire-and-forget prefetch for a list of URLs.
	 * Call this at startup so all HTML is cached before the user navigates —
	 * slower initial load, zero-network transitions afterward.
	 *
	 * Failed fetches are silently ignored so a missing route doesn't block others.
	 *
	 * @param {string[]} urls
	 * @returns {Promise<void>}
	 */
	async preloadAll(urls) {
		await Promise.all(urls.map((url) => this._fetch(url).catch(() => {})))
	}

	async _fetch(url) {
		if (this._cache.has(url)) return

		const response = await fetch(url, {
			headers: { 'X-Requested-With': 'velum-router' },
		})

		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.status}`)
		}

		const html = await response.text()

		// Extract stable metadata from the HTML without holding element refs.
		// The container itself is NOT cached — see _parse() for why.
		const doc = new DOMParser().parseFromString(html, 'text/html')
		const container = doc.querySelector(this.containerSelector)

		if (!container) {
			throw new Error(`Container ${this.containerSelector} not found in ${url}`)
		}

		this._cache.set(url, {
			html,
			namespace: container.getAttribute('data-namespace') || null,
			title: doc.querySelector('title')?.textContent ?? document.title,
		})
	}

	/**
	 * Re-parse a fresh container element from cached HTML.
	 *
	 * We intentionally do NOT cache the container element itself. Once a
	 * container is staged and animated, GSAP writes inline styles onto it
	 * (xPercent, opacity, transforms). Reusing that same element on the next
	 * navigation would carry those stale styles into the new transition.
	 * Parsing from HTML is synchronous and fast — far cheaper than a network
	 * fetch — so the tradeoff is worth it.
	 *
	 * @param {string} url
	 * @returns {LoadedPage}
	 */
	_parse(url) {
		const { html, namespace, title } = this._cache.get(url)

		const doc = new DOMParser().parseFromString(html, 'text/html')
		const container = doc.querySelector(this.containerSelector)
		const heroIndex = buildIndex(container, this.heroAttr)

		return { url, html, doc, container, namespace, title, heroIndex }
	}
}

/**
 * @typedef {object} LoadedPage
 * @property {string}           url
 * @property {string}           html
 * @property {Document}         doc
 * @property {HTMLElement}      container
 * @property {string|null}      namespace
 * @property {string}           title
 * @property {Map<string, HTMLElement>} heroIndex  - Pre-built attr→element map
 */
