// lib/velum/router.js
import { PageLoader } from './pageLoader.js'
import { runTransition } from './transition.js'

export function createRouter(options) {
	return new Router(options)
}

class Router {
	constructor({
		containerSelector = '[data-router-view]',
		linkSelector = 'a[href^="/"]',
		routes = {},
		transition = null,
		onNavigationError = null,
	} = {}) {
		this.containerSelector = containerSelector
		this.linkSelector = linkSelector
		this.routes = routes
		this.defaultTransition = transition
		this.onNavigationError = onNavigationError

		this.pageLoader = new PageLoader({ containerSelector })
		this.currentUrl = window.location.pathname + window.location.search
		this.isNavigating = false

		this._onLinkClick = this._onLinkClick.bind(this)
		this._onPopState = this._onPopState.bind(this)
	}

	start() {
		this.container = document.querySelector(this.containerSelector)
		if (!this.container) {
			throw new Error(
				`Router: container "${this.containerSelector}" not found in DOM`
			)
		}

		this.currentNamespace =
			this.container.getAttribute('data-namespace') || '/'
		this._bindLinks()
		window.addEventListener('popstate', this._onPopState)
	}

	destroy() {
		this._unbindLinks()
		window.removeEventListener('popstate', this._onPopState)
	}

	_bindLinks() {
		document.addEventListener('click', this._onLinkClick)
	}

	_unbindLinks() {
		document.removeEventListener('click', this._onLinkClick)
	}

	_onLinkClick(e) {
		// Only left click, no modifier keys
		if (
			e.defaultPrevented ||
			e.button !== 0 ||
			e.metaKey ||
			e.ctrlKey ||
			e.shiftKey ||
			e.altKey
		) {
			return
		}

		const link = e.target.closest(this.linkSelector)
		if (!link) return

		const href = link.getAttribute('href')

		// Ignore external links and anchors
		if (!href || href.startsWith('http') || href.startsWith('#')) return

		e.preventDefault()
		this.navigate(href)
	}

	_onPopState() {
		const url = window.location.pathname + window.location.search
		this.navigate(url, { pushState: false })
	}

	getRouteForNamespace(namespace) {
		// routes is an object: { '/': { namespace: 'home', ... }, '/about': {...} }
		// we match by namespace first, fallback to exact path
		const entries = Object.entries(this.routes)

		const byNamespace = entries.find(
			([, config]) => config.namespace === namespace
		)
		if (byNamespace) return { path: byNamespace[0], config: byNamespace[1] }

		const byPath = entries.find(([path]) => path === namespace)
		if (byPath) return { path: byPath[0], config: byPath[1] }

		return null
	}

	getRouteForUrl(url) {
		const path = url.split('?')[0]
		const config = this.routes[path]
		return config ? { path, config } : null
	}

	async navigate(url, { pushState = true } = {}) {
		if (this.isNavigating || url === this.currentUrl) return
		this.isNavigating = true

		const fromContainer = this.container
		const fromNamespace = this.currentNamespace
		const fromRoute =
			this.getRouteForNamespace(fromNamespace)?.config || null

		try {
			const page = await this.pageLoader.load(url)
			const toContainer = page.container
			const toRoute = this.getRouteForUrl(page.url)?.config || null

			// Update document title
			document.title = page.title

			// Insert the new container into DOM, hidden initially
			// We'll clone it so we don't move it from the parsed doc
			const temp = toContainer.cloneNode(true)
			temp.style.opacity = '0'
			temp.style.position = 'absolute'
			temp.style.inset = '0'
			temp.style.pointerEvents = 'none'
			temp.setAttribute('data-router-pending', 'true')

			// Append before animating
			fromContainer.parentNode.insertBefore(
				temp,
				fromContainer.nextSibling
			)

			// Call onLeave for old route (if any)
			if (fromRoute?.onLeave) {
				await fromRoute.onLeave({
					container: fromContainer,
					url: this.currentUrl,
				})
			}

			// Run global transition (between from & to)
			await runTransition(this.defaultTransition, {
				from: fromContainer,
				to: temp,
				fromRoute,
				toRoute,
				direction: pushState ? 'forward' : 'back',
			})

			// Swap DOM: remove old container, finalize new
			fromContainer.remove()
			temp.style.opacity = ''
			temp.style.position = ''
			temp.style.inset = ''
			temp.style.pointerEvents = ''
			temp.removeAttribute('data-router-pending')

			// Update router state
			this.container = temp
			this.currentUrl = url
			this.currentNamespace =
				temp.getAttribute('data-namespace') || this.currentNamespace

			// Update history
			if (pushState) {
				window.history.pushState({}, '', url)
			}

			// Run onEnter for new route
			if (toRoute?.onEnter) {
				await toRoute.onEnter({ container: this.container, url })
			}
		} catch (err) {
			console.error('[velum router] navigation error', err)
			if (this.onNavigationError) {
				this.onNavigationError(err, { url })
			} else {
				// fallback: full reload
				window.location.href = url
			}
		} finally {
			this.isNavigating = false
		}
	}
}
