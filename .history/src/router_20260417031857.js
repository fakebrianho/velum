// // lib/velum/router.js
// import { PageLoader } from './pageLoader.js'
// import { runTransition } from './transition.js'
// import { createTransitionRegistry } from './transitionRegistry.js'

// export function createRouter(options) {
// 	return new Router(options)
// }

// class Router {
// 	constructor({
// 		containerSelector = '[data-router-view]',
// 		linkSelector = 'a[href^="/"]',
// 		routes = {},
// 		transitions = [],
// 		onNavigationError = null,
// 	} = {}) {
// 		this.containerSelector = containerSelector
// 		this.linkSelector = linkSelector
// 		this.routes = routes
// 		this.transition = createTransitionRegistry(transitions)
// 		this.onNavigationError = onNavigationError

// 		this.pageLoader = new PageLoader({ containerSelector })
// 		this.currentUrl = window.location.pathname + window.location.search
// 		this.isNavigating = false

// 		this._onLinkClick = this._onLinkClick.bind(this)
// 		this._onPopState = this._onPopState.bind(this)
// 	}

// 	start() {
// 		this.container = document.querySelector(this.containerSelector)
// 		if (!this.container) {
// 			throw new Error(
// 				`Router: container "${this.containerSelector}" not found in DOM`
// 			)
// 		}

// 		this.currentNamespace =
// 			this.container.getAttribute('data-namespace') || '/'
// 		this._bindLinks()
// 		window.addEventListener('popstate', this._onPopState)
// 	}

// 	destroy() {
// 		this._unbindLinks()
// 		window.removeEventListener('popstate', this._onPopState)
// 	}

// 	_bindLinks() {
// 		document.addEventListener('click', this._onLinkClick)
// 	}

// 	_unbindLinks() {
// 		document.removeEventListener('click', this._onLinkClick)
// 	}

// 	_onLinkClick(e) {
// 		if (
// 			e.defaultPrevented ||
// 			e.button !== 0 ||
// 			e.metaKey ||
// 			e.ctrlKey ||
// 			e.shiftKey ||
// 			e.altKey
// 		) {
// 			return
// 		}

// 		const link = e.target.closest(this.linkSelector)
// 		if (!link) return

// 		const href = link.getAttribute('href')
// 		if (!href || href.startsWith('http') || href.startsWith('#')) return

// 		e.preventDefault()
// 		this.navigate(href)
// 	}

// 	_onPopState() {
// 		const url = window.location.pathname + window.location.search
// 		this.navigate(url, { pushState: false })
// 	}

// 	getRouteForNamespace(namespace) {
// 		const entries = Object.entries(this.routes)

// 		const byNamespace = entries.find(
// 			([, config]) => config.namespace === namespace
// 		)
// 		if (byNamespace) return { path: byNamespace[0], config: byNamespace[1] }

// 		const byPath = entries.find(([path]) => path === namespace)
// 		if (byPath) return { path: byPath[0], config: byPath[1] }

// 		return null
// 	}

// 	getRouteForUrl(url) {
// 		const path = url.split('?')[0]
// 		const config = this.routes[path]
// 		return config ? { path, config } : null
// 	}

// 	async navigate(url, { pushState = true } = {}) {
// 		if (this.isNavigating || url === this.currentUrl) return
// 		this.isNavigating = true

// 		const fromContainer = this.container
// 		const fromNamespace = this.currentNamespace
// 		const fromRoute =
// 			this.getRouteForNamespace(fromNamespace)?.config || null

// 		try {
// 			const page = await this.pageLoader.load(url)
// 			const toContainer = page.container
// 			const toRoute = this.getRouteForUrl(page.url)?.config || null

// 			document.title = page.title

// 			const parent = fromContainer.parentNode
// 			parent.style.position = 'relative'

// 			const temp = toContainer.cloneNode(true)
// 			temp.style.position = 'absolute'
// 			temp.style.top = fromContainer.offsetTop + 'px'
// 			temp.style.left = fromContainer.offsetLeft + 'px'
// 			temp.style.width = fromContainer.offsetWidth + 'px'
// 			temp.style.opacity = '0'
// 			temp.style.pointerEvents = 'none'
// 			temp.setAttribute('data-router-pending', 'true')

// 			fromContainer.after(temp)

// 			if (fromRoute?.onLeave) {
// 				await fromRoute.onLeave({
// 					container: fromContainer,
// 					url: this.currentUrl,
// 				})
// 			}

// 			const enterPromise = toRoute?.onEnter
// 				? toRoute.onEnter({ container: temp, url })
// 				: null

// 			await runTransition(this.transition, {
// 				from: fromContainer,
// 				to: temp,
// 				fromRoute,
// 				toRoute,
// 				direction: pushState ? 'forward' : 'back',
// 			})

// 			fromContainer.remove()
// 			temp.style.opacity = '1'
// 			temp.style.position = ''
// 			temp.style.top = ''
// 			temp.style.left = ''
// 			temp.style.width = ''
// 			temp.style.pointerEvents = ''
// 			parent.style.position = ''
// 			temp.removeAttribute('data-router-pending')

// 			this.container = temp
// 			this.currentUrl = url
// 			this.currentNamespace =
// 				temp.getAttribute('data-namespace') || this.currentNamespace

// 			if (pushState) {
// 				window.history.pushState({}, '', url)
// 			}

// 			if (enterPromise) await enterPromise
// 		} catch (err) {
// 			console.error('[velum router] navigation error', err)
// 			if (this.onNavigationError) {
// 				this.onNavigationError(err, { url })
// 			} else {
// 				window.location.href = url
// 			}
// 		} finally {
// 			this.isNavigating = false
// 		}
// 	}
// }
// lib/velum/router.js
// lib/velum/router.js
import { PageLoader } from './pageLoader.js'
import { runTransition } from './transition.js'
import { createTransitionRegistry } from './transitionRegistry.js'

export function createRouter(options) {
	return new Router(options)
}

class Router {
	constructor({
		containerSelector = '[data-router-view]',
		linkSelector = 'a[href^="/"]',
		routes = {},
		transitions = [],
		onNavigationError = null,
	} = {}) {
		this.containerSelector = containerSelector
		this.linkSelector = linkSelector
		this.routes = routes
		this.transitions = createTransitionRegistry(transitions)
		this.onNavigationError = onNavigationError

		this.pageLoader = new PageLoader({ containerSelector })

		this.container = null
		this.currentUrl = window.location.pathname + window.location.search
		this.currentNamespace = null
		this.isNavigating = false

		this._onLinkClick = this._onLinkClick.bind(this)
		this._onPopState = this._onPopState.bind(this)
	}

	start() {
		this.container = document.querySelector(this.containerSelector)
		console.log('ti', this.container)
		if (!this.container) {
			throw new Error(
				`Router: container "${this.containerSelector}" not found in DOM`,
			)
		}

		this.currentNamespace = this._getNamespace(this.container)

		document.addEventListener('click', this._onLinkClick)
		window.addEventListener('popstate', this._onPopState)
	}

	destroy() {
		document.removeEventListener('click', this._onLinkClick)
		window.removeEventListener('popstate', this._onPopState)
	}

	_onLinkClick(e) {
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

		if (this._shouldLetBrowserHandle(link)) return

		const href = link.getAttribute('href')
		if (!href) return

		e.preventDefault()

		this.navigate(href, {
			pushState: true,
			trigger: 'link',
			link,
		})
	}

	_onPopState() {
		const url = window.location.pathname + window.location.search

		this.navigate(url, {
			pushState: false,
			trigger: 'popstate',
			link: null,
		})
	}

	_shouldLetBrowserHandle(link) {
		const href = link.getAttribute('href')
		if (!href) return true

		if (href.startsWith('#')) return true
		if (link.hasAttribute('download')) return true
		if (link.getAttribute('target') === '_blank') return true

		const nextUrl = new URL(link.href, window.location.origin)
		const currentUrl = new URL(window.location.href)

		if (nextUrl.origin !== window.location.origin) return true

		// same-page hash jump
		if (
			nextUrl.pathname === currentUrl.pathname &&
			nextUrl.search === currentUrl.search &&
			nextUrl.hash &&
			nextUrl.hash !== currentUrl.hash
		) {
			return true
		}

		return false
	}

	_getNamespace(container) {
		return container?.getAttribute('data-namespace') || '/'
	}

	_getPathFromUrl(url) {
		return url.split('?')[0]
	}

	getRouteForNamespace(namespace) {
		const entries = Object.entries(this.routes)

		const byNamespace = entries.find(
			([, config]) => config.namespace === namespace,
		)
		if (byNamespace) {
			return {
				path: byNamespace[0],
				config: byNamespace[1],
			}
		}

		const byPath = entries.find(([path]) => path === namespace)
		if (byPath) {
			return {
				path: byPath[0],
				config: byPath[1],
			}
		}

		return null
	}

	getRouteForUrl(url) {
		const path = this._getPathFromUrl(url)
		const config = this.routes[path]

		if (!config) return null

		return {
			path,
			config,
		}
	}

	_createStageElements(fromContainer, toContainer) {
		const parent = fromContainer.parentNode

		if (!parent) {
			throw new Error('Router: current container has no parent node')
		}

		const previousParentPosition = parent.style.position
		const computedParentPosition = window.getComputedStyle(parent).position

		if (computedParentPosition === 'static') {
			parent.style.position = 'relative'
		}

		toContainer.setAttribute('data-router-stage', 'next')
		toContainer.style.position = 'absolute'
		toContainer.style.top = `${fromContainer.offsetTop}px`
		toContainer.style.left = `${fromContainer.offsetLeft}px`
		toContainer.style.width = `${fromContainer.offsetWidth}px`
		toContainer.style.opacity = '0'
		toContainer.style.pointerEvents = 'none'

		fromContainer.after(toContainer)

		return {
			parent,
			previousParentPosition,
			stagedContainer: toContainer,
		}
	}

	_clearStageStyles(container) {
		container.removeAttribute('data-router-stage')
		container.style.position = ''
		container.style.top = ''
		container.style.left = ''
		container.style.width = ''
		container.style.opacity = ''
		container.style.pointerEvents = ''
	}

	_commitNavigation({
		fromContainer,
		toContainer,
		parent,
		previousParentPosition,
		url,
		pushState,
	}) {
		fromContainer.remove()

		this._clearStageStyles(toContainer)

		parent.style.position = previousParentPosition

		this.container = toContainer
		this.currentUrl = url
		this.currentNamespace = this._getNamespace(toContainer)

		if (pushState) {
			window.history.pushState({}, '', url)
		}
	}

	async _runRouteHook(hook, payload) {
		if (typeof hook === 'function') {
			await hook(payload)
		}
	}

	async navigate(
		url,
		{ pushState = true, trigger = 'programmatic', link = null } = {},
	) {
		if (this.isNavigating) return
		if (url === this.currentUrl) return

		this.isNavigating = true

		const fromContainer = this.container
		const fromNamespace = this.currentNamespace
		const previousUrl = this.currentUrl

		const fromRouteEntry = this.getRouteForNamespace(fromNamespace)
		const fromRoute = fromRouteEntry?.config || null

		try {
			const page = await this.pageLoader.load(url)
			const toContainer = page.container
			const toNamespace = this._getNamespace(toContainer)

			const toRouteEntry =
				this.getRouteForNamespace(toNamespace) ||
				this.getRouteForUrl(page.url)
			const toRoute = toRouteEntry?.config || null

			document.title = page.title

			const { parent, previousParentPosition, stagedContainer } =
				this._createStageElements(fromContainer, toContainer)

			const context = {
				from: fromContainer,
				to: stagedContainer,
				fromRoute,
				toRoute,
				fromNamespace,
				toNamespace,
				fromUrl: previousUrl,
				toUrl: page.url,
				trigger,
				link,
				direction: pushState ? 'forward' : 'back',
				router: this,
			}

			await this._runRouteHook(fromRoute?.onBeforeLeave, {
				container: fromContainer,
				url: previousUrl,
				nextUrl: page.url,
				namespace: fromNamespace,
				router: this,
			})

			await this._runRouteHook(toRoute?.onBeforeEnter, {
				container: stagedContainer,
				url: page.url,
				fromUrl: previousUrl,
				namespace: toNamespace,
				router: this,
			})

			await runTransition(this.transitions, context)

			this._commitNavigation({
				fromContainer,
				toContainer: stagedContainer,
				parent,
				previousParentPosition,
				url: page.url,
				pushState,
			})

			await this._runRouteHook(fromRoute?.onAfterLeave, {
				container: fromContainer,
				url: previousUrl,
				nextUrl: page.url,
				namespace: fromNamespace,
				router: this,
			})

			await this._runRouteHook(toRoute?.onEnter, {
				container: this.container,
				url: this.currentUrl,
				fromUrl: previousUrl,
				namespace: this.currentNamespace,
				router: this,
			})
		} catch (err) {
			console.error('[velum router] navigation error', err)

			if (this.onNavigationError) {
				this.onNavigationError(err, { url })
			} else {
				window.location.href = url
			}
		} finally {
			this.isNavigating = false
		}
	}
}
