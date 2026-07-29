<script setup lang="ts">
const props = defineProps<{ total: number; answered: number }>();

function stateOf(index: number): string {
    if (index < props.answered) {
        return 'done';
    }
    return index === props.answered ? 'current' : 'todo';
}
</script>

<template>
    <div
        class="dots"
        role="progressbar"
        aria-label="Interview progress"
        :aria-valuenow="props.answered"
        aria-valuemin="0"
        :aria-valuemax="props.total"
    >
        <span v-for="index in props.total" :key="index" class="dot" :class="stateOf(index - 1)" />
    </div>
</template>

<style scoped>
.dots {
    display: flex;
    gap: 6px;
}

.dot {
    width: 8px;
    height: 8px;
    background: var(--border);
    border-radius: 50%;
}

.done {
    background: var(--accent-bright);
    box-shadow: 0 0 8px rgba(199, 191, 255, 0.4);
}

.current {
    background: rgba(199, 191, 255, 0.4);
    animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.45;
    }
}

@media (prefers-reduced-motion: reduce) {
    .current {
        animation: none;
    }
}
</style>
