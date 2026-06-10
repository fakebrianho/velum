/* ============================================================
   JASON EMER MD — flagship site
   Built on velum (router + transitions) · GSAP · Lenis
   Blur is the signature motif: pages defocus out and resolve
   in, content sharpens into focus on scroll, the menu is a
   frosted veil over the page.
   ============================================================ */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { createRouter, createTransition } from '../../index.js'

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------
   Smooth scroll
   ------------------------------------------------------------ */

const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

/* ------------------------------------------------------------
   THE BLUR TRANSITION
   Outgoing page defocuses and dissolves; scroll resets while
   nothing is legible; the incoming page resolves into focus.
   ------------------------------------------------------------ */

const BLUR_OUT = 'blur(26px)'
const BLUR_NONE = 'blur(0px)'

const blurTransition = createTransition(({ from, to, tl }) => {
	tl.set(to, { opacity: 0, filter: BLUR_OUT, scale: 1.015 })

	if (from) {
		tl.to(from, {
			opacity: 0,
			filter: BLUR_OUT,
			scale: 0.99,
			duration: 0.55,
			ease: 'power2.in',
		})
	}

	// The world is out of focus — reset scroll invisibly.
	tl.add(() => {
		lenis.scrollTo(0, { immediate: true, force: true })
		window.scrollTo(0, 0)
	})

	tl.to(to, {
		opacity: 1,
		filter: BLUR_NONE,
		scale: 1,
		duration: 0.95,
		ease: 'power3.out',
	})

	tl.set(to, { clearProps: 'filter,scale,opacity' })
})

/* ------------------------------------------------------------
   Per-page lifecycle
   Each page gets a gsap.context so every ScrollTrigger and
   tween can be reverted cleanly when the page leaves.
   ------------------------------------------------------------ */

let pageCtx = null

function teardownPage() {
	if (pageCtx) {
		pageCtx.revert()
		pageCtx = null
	}
}

function initPage(container) {
	teardownPage()

	pageCtx = gsap.context(() => {
		// The home hero uses the aperture-fold reveal; interior pages keep
		// the character blur-in intro.
		if (!initHeroFold(container)) initHeroIntro(container)

		// Interactive widgets: listeners live on elements that are discarded
		// wholesale on navigation; their ScrollTriggers revert with the context.
		container.querySelectorAll('[data-ba]').forEach(initBeforeAfter)
		initResultsFilters(container)

		if (reduceMotion) {
			gsap.set(container.querySelectorAll('[data-reveal]'), {
				opacity: 1,
				filter: 'none',
				y: 0,
			})
			return
		}
		initBlurReveals(container)
		initBlurWords(container)
		initHeroParallax(container)
		initMarquees(container)
	}, container)

	ScrollTrigger.refresh()
}

/* ---------- home hero: the aperture fold ----------
   1. A white line draws from center to full width.
   2. The frame opens from the middle (clip-path fold), the line
      splitting into the top and bottom edges as it goes.
   3. Text rises inside the fold like drawers. */

function initHeroFold(container) {
	const stage = container.querySelector('[data-hero-stage]')
	if (!stage) return false

	const frame = stage.querySelector('[data-hero-frame]')
	const lines = stage.querySelectorAll('.hero__line')
	const drawers = frame.querySelectorAll('.drawer__inner')
	const img = frame.querySelector('img')

	if (reduceMotion) {
		gsap.set(frame, { clipPath: 'none' })
		gsap.set(lines, { autoAlpha: 0 })
		gsap.set(drawers, { y: 0, yPercent: 0 })
		return true
	}

	const half = frame.offsetHeight / 2
	const tl = gsap.timeline({ delay: 0.25 })

	// normalize the CSS initial states onto GSAP-controlled values
	tl.set(frame, { clipPath: 'inset(50% 0% 50% 0% round 28px)' })
	tl.set(drawers, { yPercent: 115, y: 0 })

	// 1 — the line draws out from center
	tl.to(lines, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' })

	// 2 — the fold opens; the two lines ride the opening edges
	tl.to(
		frame,
		{
			clipPath: 'inset(0% 0% 0% 0% round 28px)',
			duration: 1.25,
			ease: 'power4.inOut',
		},
		'+=0.08',
	)
	tl.to(lines[0], { y: -half, duration: 1.25, ease: 'power4.inOut' }, '<')
	tl.to(lines[1], { y: half, duration: 1.25, ease: 'power4.inOut' }, '<')
	tl.fromTo(
		img,
		{ scale: 1.18 },
		{ scale: 1.06, duration: 1.7, ease: 'power3.out' },
		'<0.1',
	)
	tl.to(lines, { opacity: 0, duration: 0.35, ease: 'power1.out' }, '-=0.4')

	// 3 — drawers slide the copy up inside the fold
	tl.to(
		drawers,
		{ yPercent: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09 },
		'-=0.95',
	)

	return true
}

/* ---------- hero intro: characters resolve out of blur ---------- */

function initHeroIntro(container) {
	const title = container.querySelector('[data-split]')
	const fades = container.querySelectorAll('[data-hero-fade]')

	if (title && !title.dataset.splitDone) {
		const text = title.textContent
		title.setAttribute('aria-label', text)
		title.textContent = ''
		text.split(' ').forEach((word, w, arr) => {
			const wordEl = document.createElement('span')
			wordEl.className = 'word'
			wordEl.setAttribute('aria-hidden', 'true')
			for (const ch of word) {
				const charEl = document.createElement('span')
				charEl.className = 'char'
				charEl.textContent = ch
				wordEl.appendChild(charEl)
			}
			title.appendChild(wordEl)
			if (w < arr.length - 1) title.appendChild(document.createTextNode(' '))
		})
		title.dataset.splitDone = 'true'
	}

	if (reduceMotion) return

	const chars = title ? title.querySelectorAll('.char') : []
	const tl = gsap.timeline({ delay: 0.15 })

	if (chars.length) {
		tl.fromTo(
			chars,
			{ opacity: 0, filter: 'blur(14px)', y: 26 },
			{
				opacity: 1,
				filter: 'blur(0px)',
				y: 0,
				duration: 1.1,
				ease: 'power3.out',
				stagger: { each: 0.022, from: 'start' },
			},
		)
	}

	if (fades.length) {
		tl.fromTo(
			fades,
			{ opacity: 0, filter: 'blur(10px)', y: 14 },
			{
				opacity: 1,
				filter: 'blur(0px)',
				y: 0,
				duration: 1,
				ease: 'power2.out',
				stagger: 0.12,
			},
			chars.length ? 0.45 : 0,
		)
	}
}

/* ---------- scroll reveals: everything sharpens into focus ---------- */

function initBlurReveals(container) {
	container.querySelectorAll('[data-reveal]').forEach((el) => {
		gsap.to(el, {
			opacity: 1,
			filter: 'blur(0px)',
			y: 0,
			duration: 1.25,
			ease: 'power3.out',
			scrollTrigger: {
				trigger: el,
				start: 'top 88%',
				once: true,
			},
			// Drop the attribute so the stylesheet's hidden/blurred initial
			// state can't re-apply once inline styles are cleared.
			onComplete: () => {
				el.removeAttribute('data-reveal')
				gsap.set(el, { clearProps: 'opacity,filter,transform' })
			},
		})
	})

	container.querySelectorAll('[data-reveal-img]').forEach((el) => {
		const img = el.querySelector('img')
		if (!img) return
		gsap.to(img, {
			filter: 'grayscale(1) contrast(1.15) brightness(0.85) blur(0px)',
			scale: 1,
			duration: 1.6,
			ease: 'power3.out',
			scrollTrigger: {
				trigger: el,
				start: 'top 85%',
				once: true,
			},
		})
	})
}

/* ---------- manifesto: words scrub from haze to clarity ---------- */

function initBlurWords(container) {
	container.querySelectorAll('[data-blur-words]').forEach((el) => {
		if (!el.dataset.wordsSplit) {
			const nodes = [...el.childNodes]
			el.textContent = ''
			nodes.forEach((node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					node.textContent.split(/(\s+)/).forEach((part) => {
						if (!part) return
						if (/^\s+$/.test(part)) {
							el.appendChild(document.createTextNode(' '))
						} else {
							const span = document.createElement('span')
							span.className = 'blur-word'
							span.textContent = part
							el.appendChild(span)
						}
					})
				} else {
					// keep styled spans (italics) intact as a single unit
					node.classList?.add('blur-word')
					el.appendChild(node)
				}
			})
			el.dataset.wordsSplit = 'true'
		}

		const words = el.querySelectorAll('.blur-word')
		gsap.fromTo(
			words,
			{ opacity: 0.14, filter: 'blur(7px)' },
			{
				opacity: 1,
				filter: 'blur(0px)',
				ease: 'none',
				stagger: 0.06,
				scrollTrigger: {
					trigger: el,
					start: 'top 82%',
					end: 'bottom 45%',
					scrub: 0.6,
				},
			},
		)
	})
}

/* ---------- hero media parallax + defocus on exit ---------- */

function initHeroParallax(container) {
	const media = container.querySelector('[data-hero-media]')
	if (!media) return
	const img = media.querySelector('img')

	// As the hero scrolls away it slides and slips back out of focus —
	// blur stays as the exit accent, not the entrance.
	gsap.to(img, {
		yPercent: 14,
		filter: 'grayscale(1) contrast(1.12) brightness(0.45) blur(10px)',
		ease: 'none',
		scrollTrigger: {
			trigger: media,
			start: 'top top',
			end: 'bottom top',
			scrub: true,
		},
	})
}

/* ---------- press marquee ---------- */

function initMarquees(container) {
	container.querySelectorAll('[data-marquee]').forEach((marquee) => {
		const track = marquee.querySelector('.marquee__track')
		if (!track || track.dataset.cloned) return
		track.innerHTML += track.innerHTML
		track.dataset.cloned = 'true'
		gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
	})
}

/* ------------------------------------------------------------
   Before / After slider — pointer-driven clip reveal
   ------------------------------------------------------------ */

function initBeforeAfter(el) {
	if (el.dataset.baInit) return
	el.dataset.baInit = 'true'

	// Animate a proxy value and write the CSS var ourselves — more reliable
	// than tweening custom properties directly.
	const pos = { v: 50 }
	const render = () => el.style.setProperty('--pos', `${pos.v}%`)

	const setPos = (target) =>
		gsap.to(pos, {
			v: target,
			duration: 0.35,
			ease: 'power2.out',
			overwrite: true,
			onUpdate: render,
		})

	const posFromEvent = (e) => {
		const rect = el.getBoundingClientRect()
		const x = gsap.utils.clamp(0, rect.width, e.clientX - rect.left)
		return (x / rect.width) * 100
	}

	let dragging = false

	el.addEventListener('pointerdown', (e) => {
		dragging = true
		try {
			el.setPointerCapture(e.pointerId)
		} catch {
			/* synthetic events have no active pointer */
		}
		setPos(posFromEvent(e))
	})

	el.addEventListener('pointermove', (e) => {
		if (!dragging) return
		setPos(posFromEvent(e))
	})

	const release = () => (dragging = false)
	el.addEventListener('pointerup', release)
	el.addEventListener('pointercancel', release)

	// idle hint: handle drifts once to invite interaction
	if (!reduceMotion) {
		gsap.to(pos, {
			v: 42,
			duration: 1.4,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: 1,
			delay: 0.4,
			onUpdate: render,
			scrollTrigger: { trigger: el, start: 'top 75%', once: true },
		})
	}
}

/* ------------------------------------------------------------
   Results gallery filters (gender × ethnicity)
   ------------------------------------------------------------ */

function initResultsFilters(container) {
	const bar = container.querySelector('[data-filter-bar]')
	const grid = container.querySelector('[data-results-grid]')
	if (!bar || !grid) return

	const empty = container.querySelector('[data-results-empty]')
	const state = { gender: 'all', ethnicity: 'all' }

	const apply = () => {
		const cards = [...grid.querySelectorAll('.result-card')]
		const matches = (card) =>
			(state.gender === 'all' || card.dataset.gender === state.gender) &&
			(state.ethnicity === 'all' || card.dataset.ethnicity === state.ethnicity)

		const tl = gsap.timeline()
		tl.to(grid, {
			opacity: 0,
			filter: 'blur(14px)',
			duration: 0.32,
			ease: 'power2.in',
		})
		tl.add(() => {
			let visible = 0
			cards.forEach((card) => {
				const show = matches(card)
				card.classList.toggle('is-hidden', !show)
				if (show) visible++
			})
			if (empty) empty.hidden = visible !== 0
			ScrollTrigger.refresh()
		})
		tl.to(grid, {
			opacity: 1,
			filter: 'blur(0px)',
			duration: 0.55,
			ease: 'power3.out',
		})
	}

	bar.addEventListener('click', (e) => {
		const btn = e.target.closest('.filter-btn')
		if (!btn) return
		const key = btn.dataset.filterGender ? 'gender' : 'ethnicity'
		const value = btn.dataset.filterGender || btn.dataset.filterEthnicity
		if (state[key] === value) return
		state[key] = value
		const attr = key === 'gender' ? 'data-filter-gender' : 'data-filter-ethnicity'
		bar.querySelectorAll(`[${attr}]`).forEach((b) =>
			b.classList.toggle('is-active', b === btn),
		)
		apply()
	})
}

/* ------------------------------------------------------------
   Menu overlay — the frosted veil (persistent chrome)
   ------------------------------------------------------------ */

const menuEl = document.querySelector('[data-menu]')
const menuToggle = document.querySelector('[data-menu-toggle]')
let menuOpen = false

const menuLinks = menuEl.querySelectorAll('.menu-link')
const menuSearch = menuEl.querySelector('.menu-search')
const menuFoot = menuEl.querySelector('.menu-foot')

function openMenu() {
	if (menuOpen) return
	menuOpen = true
	document.body.classList.add('menu-open')
	lenis.stop()

	gsap.killTweensOf([menuEl, ...menuLinks, menuSearch, menuFoot])
	const tl = gsap.timeline()
	tl.set(menuEl, { visibility: 'visible' })
	tl.to(menuEl, { opacity: 1, duration: 0.45, ease: 'power2.out' })
	tl.fromTo(
		menuLinks,
		{ opacity: 0, filter: 'blur(12px)', y: 24 },
		{
			opacity: 1,
			filter: 'blur(0px)',
			y: 0,
			duration: 0.8,
			ease: 'power3.out',
			stagger: 0.06,
		},
		0.12,
	)
	tl.fromTo(
		[menuSearch, menuFoot],
		{ opacity: 0, filter: 'blur(8px)' },
		{ opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out', stagger: 0.08 },
		0.3,
	)
}

function closeMenu({ instant = false } = {}) {
	if (!menuOpen) return
	menuOpen = false
	document.body.classList.remove('menu-open')
	lenis.start()

	gsap.killTweensOf([menuEl, ...menuLinks, menuSearch, menuFoot])
	if (instant) {
		gsap.set(menuEl, { opacity: 0, visibility: 'hidden' })
		return
	}
	gsap.to(menuEl, {
		opacity: 0,
		duration: 0.4,
		ease: 'power2.in',
		onComplete: () => gsap.set(menuEl, { visibility: 'hidden' }),
	})
}

menuToggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()))
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeMenu()
})

/* ------------------------------------------------------------
   Search — cross-category index
   "Botox" returns face, body, sweating, headache, trigger point…
   ------------------------------------------------------------ */

const SEARCH_INDEX = [
	{ name: 'Botox — Face', cat: 'Movement Lines · Face', href: '/treatments', tags: 'botox neuromodulator wrinkles forehead brow-in frown lines' },
	{ name: 'Botox — Body Contouring', cat: 'Body · Torsana™', href: '/treatments', tags: 'botox body slimming traps calves masseter' },
	{ name: 'Botox — Hyperhidrosis', cat: 'Sweating', href: '/treatments', tags: 'botox sweating hyperhidrosis underarms palms' },
	{ name: 'Botox — Migraine & Headache', cat: 'Therapeutic', href: '/treatments', tags: 'botox migraine headache therapeutic' },
	{ name: 'Botox — Trigger Point', cat: 'Therapeutic', href: '/treatments', tags: 'botox trigger point muscle tension neck' },
	{ name: 'Structuronics™', cat: 'Dermal Filler', href: '/treatments#structuronics', tags: 'filler dermal filler bone tissue surface volume cheek jaw chin structuronics' },
	{ name: 'Reskin™ — Restore', cat: 'Acne Scars · Tier I', href: '/treatments#reskin', tags: 'acne scars resurfacing texture reskin restore mild' },
	{ name: 'Reskin™ — Repair', cat: 'Acne Scars · Tier II', href: '/treatments#reskin', tags: 'acne scars subcision laser reskin repair moderate' },
	{ name: 'Reskin™ — Rebirth', cat: 'Acne Scars · Tier III', href: '/treatments#reskin', tags: 'acne scars severe reconstruction reskin rebirth' },
	{ name: 'Maxaris™', cat: 'Male Body Surgery', href: '/treatments#maxaris', tags: 'male liposuction hi-def body sculpting ab etching maxaris men' },
	{ name: 'Celesta™ — Face', cat: 'Female · Face', href: '/treatments#celesta', tags: 'female facial balancing harmonization celesta women face' },
	{ name: 'Celesta™ — Body', cat: 'Female · Body', href: '/treatments#celesta', tags: 'female body contouring curves celesta women body bbl' },
	{ name: 'Source Code™ — Hair PRP', cat: 'PRP · Hair', href: '/treatments#source-code', tags: 'prp hair loss restoration platelet source code injections' },
	{ name: 'Source Code™ — Microneedling PRP', cat: 'PRP · Skin', href: '/treatments#source-code', tags: 'prp microneedling vampire facial skin texture source code' },
	{ name: 'Source Code™ — Joint PRP', cat: 'PRP · Therapeutic', href: '/treatments#source-code', tags: 'prp joint knee shoulder regenerative source code' },
	{ name: 'Mentruck™ Zone', cat: 'Zone · Chin & Jaw', href: '/treatments', tags: 'chin jaw jawline mentruck zone projection' },
	{ name: 'Orbitoff™ Zone', cat: 'Zone · Eyes', href: '/treatments', tags: 'eyes eyelid under-eye orbitoff zone dark circles blepharoplasty' },
	{ name: 'Brow-In™ Zone', cat: 'Zone · Forehead', href: '/treatments', tags: 'forehead brow brow-in zone lines lift' },
	{ name: 'Zygomara™ Zone', cat: 'Zone · Cheek', href: '/treatments', tags: 'cheek cheekbone zygomara zone midface volume' },
	{ name: 'Results Gallery', cat: 'Before & After', href: '/results', tags: 'results before after gallery photos transformations' },
	{ name: 'Consultation', cat: 'Begin', href: '/contact', tags: 'consultation appointment book contact begin' },
]

const searchInput = document.querySelector('[data-search-input]')
const searchResults = document.querySelector('[data-search-results]')

function renderSearch(query) {
	const q = query.trim().toLowerCase()
	searchResults.innerHTML = ''
	if (q.length < 2) return

	const hits = SEARCH_INDEX.filter(
		(item) =>
			item.name.toLowerCase().includes(q) ||
			item.tags.includes(q) ||
			item.cat.toLowerCase().includes(q),
	)

	if (!hits.length) {
		const div = document.createElement('div')
		div.className = 'search-empty'
		div.textContent = 'Nothing found — try “filler”, “scars” or “botox”.'
		searchResults.appendChild(div)
		return
	}

	hits.forEach((item) => {
		const a = document.createElement('a')
		a.className = 'search-result'
		a.href = item.href
		a.innerHTML = `<em>${item.name}</em><span class="cat">${item.cat}</span>`
		searchResults.appendChild(a)
	})

	gsap.fromTo(
		searchResults.children,
		{ opacity: 0, filter: 'blur(6px)', y: 8 },
		{ opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 },
	)
}

searchInput.addEventListener('input', () => renderSearch(searchInput.value))

/* ------------------------------------------------------------
   Router — every navigation passes through the blur veil
   ------------------------------------------------------------ */

const pageHooks = {
	onEnter({ container }) {
		initPage(container)
		if (window.location.hash) {
			const target = container.querySelector(window.location.hash)
			if (target) lenis.scrollTo(target, { offset: -90 })
		}
	},
	onAfterLeave() {
		teardownPage()
	},
}

const router = createRouter({
	routes: [
		{ path: '/', ...pageHooks },
		{ path: '/treatments', ...pageHooks },
		{ path: '/results', ...pageHooks },
		{ path: '/about', ...pageHooks },
		{ path: '/contact', ...pageHooks },
	],
	transitions: [
		{ name: 'blur-veil', from: '*', to: '*', handler: blurTransition },
	],
})

// Close the menu the moment a navigation begins so the veil
// hands off to the page-level blur transition.
document.addEventListener('click', (e) => {
	const link = e.target.closest('a[href^="/"]')
	if (link && menuOpen) closeMenu()
})

router.start()
initPage(document.querySelector('[data-router-view]'))
