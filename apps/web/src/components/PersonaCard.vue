<script setup lang="ts">
import type { PersonaDto } from '@interviewer/shared';

const props = defineProps<{ persona: PersonaDto; selected: boolean }>();

defineEmits<{ (e: 'select', id: string): void }>();
</script>

<template>
    <button
        type="button"
        class="card"
        :class="{ selected: props.selected }"
        :aria-pressed="props.selected"
        :aria-label="`${props.persona.name}: ${props.persona.tagline}`"
        @click="$emit('select', props.persona.id)"
    >
        <span class="avatar" aria-hidden="true">{{ props.persona.emoji }}</span>
        <span class="body">
            <span class="name">{{ props.persona.name }}</span>
            <span class="tagline">{{ props.persona.tagline }}</span>
        </span>
        <span v-if="props.selected" class="check" aria-hidden="true">✓</span>
    </button>
</template>

<style scoped>
.card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
        background-color var(--transition),
        border-color var(--transition),
        transform var(--transition);
}

.card:hover:not(.selected) {
    border-color: var(--faint);
    transform: translateY(-1px);
}

.card.selected {
    background: var(--accent-soft);
    border-color: var(--accent);
}

.avatar {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--accent-soft);
    border-radius: 999px;
    font-size: 20px;
    line-height: 1;
}

.body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.name {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
}

.tagline {
    display: -webkit-box;
    overflow: hidden;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.check {
    position: absolute;
    top: var(--space-2);
    right: var(--space-3);
    color: var(--accent);
    font-size: 13px;
    line-height: 1;
}
</style>
