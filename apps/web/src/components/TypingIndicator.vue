<script setup lang="ts">
const props = defineProps<{ name: string }>();
</script>

<template>
    <div class="wrap" aria-live="polite">
        <div class="bubble">
            <span class="dot" aria-hidden="true" />
            <span class="dot" aria-hidden="true" />
            <span class="dot" aria-hidden="true" />
        </div>
        <span class="sr-only">{{ props.name }} is thinking</span>
    </div>
</template>

<style scoped>
.wrap {
    align-self: flex-start;
}

.bubble {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    padding: 0 var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px var(--radius-lg) var(--radius-lg) var(--radius-lg);
}

.dot {
    width: 6px;
    height: 6px;
    background: var(--accent-bright);
    border-radius: 50%;
    opacity: 0.6;
    animation: bounce 1.2s ease-in-out infinite both;
}

.dot:nth-child(1) {
    animation-delay: -0.4s;
}

.dot:nth-child(2) {
    animation-delay: -0.2s;
}

@keyframes bounce {
    0%,
    60%,
    100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-4px);
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .dot {
        animation: none;
    }
}
</style>
