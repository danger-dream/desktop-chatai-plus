import { h } from 'vue'

const defaultAttributes = {
	xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
	stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
}
const createVueComponent = (iconNode: any[][]) => ({ size, color, strokeWidth, ...props }, { attrs, slots }) => {
	return h(
		'svg',
		{
			...defaultAttributes,
			width: size || defaultAttributes.width,
			height: size || defaultAttributes.height,
			stroke: color || defaultAttributes.stroke,
			'stroke-width': strokeWidth || 2,
			...attrs,
			class: ['tabler-icon', attrs?.class || ''],
			...props,
		},
		[
			...iconNode.map((child) => h.apply(null, child)),
			...(slots.default ? [slots.default()] : []),
		],
	)
}

export const IconPlus = createVueComponent([
	['path', { d: 'M12 5l0 14' }], ['path', { d: 'M5 12l14 0' }],
])
export const IconPinned = createVueComponent([
	['path', { d: 'M9 4v6l-2 4v2h10v-2l-2 -4v-6' }],
	['path', { d: 'M12 16l0 5' }],
	['path', { d: 'M8 4l8 0' }],
])
export const IconPinnedOff = createVueComponent([
	['path', { d: 'M3 3l18 18' }],
	['path', { d: 'M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251' }],
	['path', { d: 'M9 15l-4.5 4.5' }],
	['path', { d: 'M14.5 4l5.5 5.5' }],
])

export const IconSend = createVueComponent([
	['path', { d: 'M10 14l11 -11' }],
	['path', { d: 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5' }],
])
export const IconClipboard = createVueComponent([
	['path', { d: 'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2' }],
	['path', { d: 'M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z' }],
])
export const IconMoon = createVueComponent([
	['path', { d: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z' }],
])
export const IconSun = createVueComponent([
	['path', { d: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' }],
	['path', { d: 'M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7' }],
])
export const IconRobotFace = createVueComponent([
	['path', { d: 'M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z' }],
	['path', { d: 'M9 16c1 .667 2 1 3 1s2 -.333 3 -1' }],
	['path', { d: 'M9 7l-1 -4' }],
	['path', { d: 'M15 7l1 -4' }],
	['path', { d: 'M9 12v-1' }],
	['path', { d: 'M15 12v-1' }],
])
export const IconUserSquareRounded = createVueComponent([
	['path', { d: 'M12 13a3 3 0 1 0 0 -6a3 3 0 0 0 0 6z' }],
	['path', { d: 'M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z' }],
	['path', { d: 'M6 20.05v-.05a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v.05' }],
])
export const IconArrowBarToUp = createVueComponent([
	['path', { d: 'M12 10l0 10' }],
	['path', { d: 'M12 10l4 4' }],
	['path', { d: 'M12 10l-4 4' }],
	['path', { d: 'M4 4l16 0' }],
])
export const IconArrowBarToDown = createVueComponent([
	['path', { d: 'M4 20l16 0' }],
	['path', { d: 'M12 14l0 -10' }],
	['path', { d: 'M12 14l4 -4' }],
	['path', { d: 'M12 14l-4 -4' }],
])
export const IconReload = createVueComponent([
	['path', { d: 'M19.933 13.041a8 8 0 1 1 -9.925 -8.788c3.899 -1 7.935 1.007 9.425 4.747' }],
	['path', { d: 'M20 4v5h-5' }],
])
export const IconTrash = createVueComponent([
	['path', { d: 'M4 7l16 0' }],
	['path', { d: 'M10 11l0 6' }],
	['path', { d: 'M14 11l0 6' }],
	['path', { d: 'M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12' }],
	['path', { d: 'M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3' }],
])
export const IconMessage = createVueComponent([
	['path', { d: 'M8 9h8' }],
	['path', { d: 'M8 13h6' }],
	['path', { d: 'M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z' }],
])
export const IconSettings = createVueComponent([
	['path', { d: 'M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z' }],
	['path', { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0' }],
])

export const IconHeadphones = createVueComponent([
	['path', { d: 'M4 13m0 2a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z' }],
	['path', { d: 'M15 13m0 2a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z' }],
	['path', { d: 'M4 15v-3a8 8 0 0 1 16 0v3' }],
])

export const IconRefresh = createVueComponent([
	["path", { d: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" }],
	["path", { d: "M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" }]
])
