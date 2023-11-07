<script setup lang='ts'>
import { reactive, watch, onMounted, onUnmounted, useAttrs, computed, nextTick } from 'vue'

const attrs = useAttrs()
const props = defineProps({
	url: { type: String, default: '' },
	play: { type: Boolean, default: false },
})
let audio: HTMLAudioElement = undefined
const state = reactive({
	url: '',
	isPlaying: false,
	duration: 0,
	currentTime: 0,
})

watch(() => props.url, (val, oldValue) => {
	if (oldValue !== val) {
		state.url = val
		loadAudio()
	}
})

watch(() => props.play, (newPlayState) => {
	state.isPlaying = newPlayState
	if (newPlayState) {
		playAudio()
	} else {
		pauseAudio()
	}
})

onMounted(() => {
	if (props.url) {
		state.url = 'file:///' + props.url.replaceAll('/', '\\')
		loadAudio()
	}
})

onUnmounted(() => {
	if (audio) {
		audio.pause()
		audio = undefined
	}
})

function loadAudio() {
	if (!audio) {
		audio = new Audio(state.url)
		audio.addEventListener('canplaythrough', () => {
			state.duration = audio.duration
		})
		audio.addEventListener('loadeddata', () => {
			state.duration = audio.duration
		})
		audio.addEventListener('timeupdate', () => {
			state.currentTime = audio.currentTime
			if (state.currentTime === state.duration) {
				state.isPlaying = false
			}
		})
		audio.addEventListener('ended', () => {
			state.isPlaying = false
		})
	} else {
		audio.pause()
		audio.src = state.url
	}
	if (props.play) {
		audio.play()
	}
}

function playAudio() {
	if (audio) {
		nextTick().then(() => {
			audio.play()
			state.isPlaying = true
		})
	}
}

function pauseAudio() {
	if (audio) {
		audio.pause()
		state.isPlaying = false
	}
}

function replayAudio() {
	if (audio) {
		audio.currentTime = 0
		audio.play()
		state.isPlaying = true
	}
}

function onClick() {
	if (state.isPlaying) {
		pauseAudio()
	} else {
		playAudio()
	}
}

function formatTime(time) {
	const minutes = Math.floor(time / 60) || 0
	const seconds = Math.floor(time % 60) || 0
	return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

const formattedCurrentTime = computed(() => formatTime(state.currentTime))
const formattedDuration = computed(() => formatTime(state.duration))
const progress = computed(() => (state.currentTime / state.duration) * 100)

</script>

<template>
	<div class='w-full p-2 bg-white border rounded-xl border-gray-200 dark:bg-gray-700 dark:border-gray-600' v-bind='attrs'>
		<div class='flex items-center justify-between'>
			<button class='inline-flex items-center justify-center p-1.5 ml-2 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group' @click='onClick'>
				<svg v-if='state.isPlaying' class='w-3 h-3 text-white' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 10 16'>
					<path fill-rule='evenodd' d='M0 .8C0 .358.32 0 .714 0h1.429c.394 0 .714.358.714.8v14.4c0 .442-.32.8-.714.8H.714a.678.678 0 0 1-.505-.234A.851.851 0 0 1 0 15.2V.8Zm7.143 0c0-.442.32-.8.714-.8h1.429c.19 0 .37.084.505.234.134.15.209.354.209.566v14.4c0 .442-.32.8-.714.8H7.857c-.394 0-.714-.358-.714-.8V.8Z' clip-rule='evenodd' />
				</svg>
				<svg v-else class='w-3 h-3 text-white' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 10 16'>
					<path d='M3.414 1A2 2 0 0 0 0 2.414v11.172A2 2 0 0 0 3.414 15L9 9.414a2 2 0 0 0 0-2.828L3.414 1Z'></path>
				</svg>
			</button>
			<button class='p-1.5 group rounded-full hover:bg-gray-100 mx-2 dark:hover:bg-gray-600' @click='replayAudio'>
				<svg class='w-4 h-4 text-gray-500 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 18 20'>
					<path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97' />
				</svg>
			</button>
			<span class='text-sm font-medium text-gray-500 dark:text-gray-400'>{{ formattedCurrentTime }}</span>
			<div class='flex-grow bg-gray-200 rounded-full h-1.5 dark:bg-gray-800 mx-2'>
				<div class='bg-blue-600 h-1.5 rounded-full' :style='{width: `${progress}%`}'></div>
			</div>
			<span class='text-sm font-medium text-gray-500 dark:text-gray-400 mr-2'>{{ formattedDuration }}</span>
		</div>
	</div>
</template>
