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

	// Finds elements with matching data-flip-key attributes across both
	// containers and records their rects. Measurements happen in two
	// separate phases so each rect reflects the true position:
	//   fromRect — measured first, while fromContainer is still in flow
	//   toRect   — measured after fromContainer is hidden and toContainer
	//              is restored to normal flow, so toContainer sits exactly
	//              where it will be once fromContainer is removed
	// Everything here is synchronous so no intermediate state is painted.
	_findSharedElements(fromContainer, toContainer) {
		const fromEls = fromContainer.querySelectorAll('[data-flip-key]')
		if (!fromEls.length) return {}

		// Phase 1 — measure from-rects while fromContainer is still in flow
		const fromData = {}
		fromEls.forEach((fromEl) => {
			const key = fromEl.getAttribute('data-flip-key')
			fromData[key] = {
				el: fromEl,
				rect: fromEl.getBoundingClientRect(),
			}
		})

		// Phase 2 — hide fromContainer from flow, restore toContainer to
		// normal flow, then measure to-rects at their true final positions
		fromContainer.style.display = 'none'

		const savedTo = {
			position: toContainer.style.position,
			top: toContainer.style.top,
			left: toContainer.style.left,
			width: toContainer.style.width,
		}
		toContainer.style.position = ''
		toContainer.style.top = ''
		toContainer.style.left = ''
		toContainer.style.width = ''

		const shared = {}
		Object.entries(fromData).forEach(([key, { el: fromEl, rect: fromRect }]) => {
			const toEl = toContainer.querySelector(`[data-flip-key="${key}"]`)
			if (!toEl) return
			shared[key] = {
				from: fromEl,
				to: toEl,
				fromRect,
				toRect: toEl.getBoundingClientRect(),
			}
		})

		// Restore both containers to their pre-measurement state
		fromContainer.style.display = ''
		toContainer.style.position = savedTo.position
		toContainer.style.top = savedTo.top
		toContainer.style.left = savedTo.left
		toContainer.style.width = savedTo.width

		return shared
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

			const parent = fromContainer.parentNode

			// Make parent a positioning context so absolute children are
			// anchored to it rather than the viewport
			parent.style.position = 'relative'

			// Clone the incoming container and absolutely position it exactly
			// over the outgoing one. fromContainer stays in normal flow the
			// whole time — nothing moves, nothing jumps.
			const temp = toContainer.cloneNode(true)
			temp.style.position = 'absolute'
			temp.style.top = fromContainer.offsetTop + 'px'
			temp.style.left = fromContainer.offsetLeft + 'px'
			temp.style.width = fromContainer.offsetWidth + 'px'
			temp.style.opacity = '0'
			temp.style.pointerEvents = 'none'
			temp.setAttribute('data-router-pending', 'true')

			// Append after fromContainer — absolute so it doesn't affect layout
			fromContainer.after(temp)

			// Call onLeave for old route (if any)
			if (fromRoute?.onLeave) {
				await fromRoute.onLeave({
					container: fromContainer,
					url: this.currentUrl,
				})
			}

			const sharedElements = this._findSharedElements(fromContainer, temp)

			// Start onEnter early — gsap.from sets element initial states
			// (opacity:0, y offset) synchronously while the container is still
			// invisible, so they animate in during the transition reveal.
			const enterPromise = toRoute?.onEnter
				? toRoute.onEnter({ container: temp, url })
				: null

			await runTransition(this.defaultTransition, {
				from: fromContainer,
				to: temp,
				fromRoute,
				toRoute,
				direction: pushState ? 'forward' : 'back',
				sharedElements,
			})

			fromContainer.remove()
			temp.style.opacity = '1'
			temp.style.position = ''
			temp.style.top = ''
			temp.style.left = ''
			temp.style.width = ''
			temp.style.pointerEvents = ''
			parent.style.position = ''
			temp.removeAttribute('data-router-pending')

			this.container = temp
			this.currentUrl = url
			this.currentNamespace =
				temp.getAttribute('data-namespace') || this.currentNamespace

			if (pushState) {
				window.history.pushState({}, '', url)
			}

			if (enterPromise) await enterPromise
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
