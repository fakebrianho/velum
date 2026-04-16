// lib/velum/pageLoader.js

export class PageLoader {
	constructor({ containerSelector }) {
		this.containerSelector = containerSelector
	}

	async load(url) {
		const response = await fetch(url, {
			headers: {
				'X-Requested-With': 'velum-router',
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.status}`)
		}

		const html = await response.text()
		const parser = new DOMParser()
		const doc = parser.parseFromString(html, 'text/html')

		const newContainer = doc.querySelector(this.containerSelector)

		if (!newContainer) {
			throw new Error(
				`Container ${this.containerSelector} not found in ${url}`
			)
		}

		const namespace = newContainer.getAttribute('data-namespace') || null
		const title = doc.querySelector('title')?.textContent ?? document.title

		return {
			url,
			html,
			doc,
			container: newContainer,
			namespace,
			title,
		}
	}
}
