<script setup lang="ts">
const props = defineProps<{ role: 'interviewer' | 'candidate'; text: string }>();
</script>

<template>
    <div class="bubble" :class="props.role">{{ props.text }}</div>
</template>

<style scoped>
.bubble {
    max-width: 80%;
    padding: var(--space-4);
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.interviewer {
    align-self: flex-start;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px var(--radius-lg) var(--radius-lg) var(--radius-lg);
    color: var(--text);
}

.candidate {
    align-self: flex-end;
    background: var(--accent-bright);
    border-radius: var(--radius-lg) 4px var(--radius-lg) var(--radius-lg);
    color: var(--on-accent-bright);
}

@media (max-width: 640px) {
    .bubble {
        max-width: 92%;
    }
}
</style>
