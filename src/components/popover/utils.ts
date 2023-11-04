export const forEachParent = (startElement: any, callback: Function) => {
	let element = startElement
	while (callback && element.parentNode && element.parentNode.tagName !== 'BODY') {
		callback(element)
		element = element.parentNode
	}
}

export const getFixedPositionParents = (element: Element): Element[] => {
	let fixed: Element[] = []
	
	forEachParent(element, (node: Element) => {
		const position = window.getComputedStyle(node).position
		
		if (position === 'fixed') {
			fixed.push(node)
		}
	})
	return fixed
}

export const getMaxZIndex = (elements: Element[] = []) => {
	return elements.reduce((z, node) => Math.max(z, parseInt(getComputedStyle(node)['z-index']) || 1), 1)
}
