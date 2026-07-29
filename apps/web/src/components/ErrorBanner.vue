<script setup lang="ts">
const props = defineProps<{ message: string }>();

defineEmits<{ (e: 'dismiss'): void }>();
</script>

<template>
    <div class="banner" role="alert">
        <p class="message">{{ props.message }}</p>
        <button type="button" class="dismiss" @click="$emit('dismiss')">Dismiss</button>
    </div>
</template>

<style scoped>
.banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: rgba(248, 81, 73, 0.12);
    border: 1px solid var(--danger);
    border-radius: var(--radius);
}

.message {
    flex: 1;
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
}

.dismiss {
    flex: none;
    padding: 0;
    background: none;
    border: none;
    color: var(--muted);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: color var(--transition);
}

.dismiss:hover {
    color: var(--text);
}
</style>
