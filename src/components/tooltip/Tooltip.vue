<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps({
	visible: { type: Boolean, default: false },
	message: { type: String }
})

const lines = computed(() => props.message.split('\n').map(x => `<p>${x}</p>`).join(''))

</script>
<template>
	<div v-if="props.visible" v-html="lines" class="tooltip-content absolute whitespace-normal font-mono text-sm rounded-lg max-w-[80%] py-[5px] px-[10px]"/>
</template>


<style>
:root {--tooltip-bg-color: #ddd;--tooltip-text-color: black;}
body.dark {--tooltip-bg-color: #333;--tooltip-text-color: white;}
</style>

<style scoped>
.tooltip-content {
	background-color: var(--tooltip-bg-color);
	color: var(--tooltip-text-color);
}
</style>














