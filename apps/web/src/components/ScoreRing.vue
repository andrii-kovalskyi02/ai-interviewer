<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const CIRCUMFERENCE = 263.9;

const props = defineProps<{ score: number }>();

const offset = ref(CIRCUMFERENCE);

const target = computed(() => CIRCUMFERENCE * (1 - Math.min(Math.max(props.score, 0), 10) / 10));

const color = computed(() => {
    if (props.score >= 8) {
        return 'var(--success)';
    }
    return props.score >= 5 ? 'var(--warning)' : 'var(--danger)';
});

const label = computed(() => props.score.toFixed(1));

onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        offset.value = target.value;
        return;
    }
    requestAnimationFrame(() => {
        offset.value = target.value;
    });
});
</script>

<template>
    <div class="ring">
        <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            role="img"
            :aria-label="`Score ${label} out of 10`"
        >
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--border)" stroke-width="7" />
            <circle
                class="arc"
                cx="48"
                cy="48"
                r="42"
                fill="none"
                :stroke="color"
                stroke-width="7"
                stroke-linecap="round"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="offset"
            />
        </svg>
        <div class="value" aria-hidden="true">
            <span class="score">{{ label }}</span>
            <span class="out-of">/ 10</span>
        </div>
    </div>
</template>

<style scoped>
.ring {
    position: relative;
    flex: none;
    width: 96px;
    height: 96px;
}

svg {
    transform: rotate(-90deg);
}

.arc {
    transition: stroke-dashoffset 600ms ease;
}

.value {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.score {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
}

.out-of {
    color: var(--faint);
    font-size: 12px;
    line-height: 1.1;
}

@media (prefers-reduced-motion: reduce) {
    .arc {
        transition: none;
    }
}
</style>
