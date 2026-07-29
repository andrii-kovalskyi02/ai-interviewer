<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Difficulty } from '@interviewer/shared';
import { useInterviewStore } from '../stores/interview';
import PersonaCard from '../components/PersonaCard.vue';
import ErrorBanner from '../components/ErrorBanner.vue';

const DIFFICULTIES = [
    { value: Difficulty.Junior, label: 'Junior' },
    { value: Difficulty.Mid, label: 'Mid' },
    { value: Difficulty.Senior, label: 'Senior' },
] as const;

const LENGTHS = [
    { value: 3, label: '3 Quick' },
    { value: 5, label: '5 Standard' },
    { value: 8, label: '8 Thorough' },
] as const;

const store = useInterviewStore();
const router = useRouter();

const role = ref('');
const roleTouched = ref(false);
const difficulty = ref<Difficulty>(Difficulty.Mid);
const questionCount = ref(5);
const personaId = ref<string | null>(null);

const trimmedRole = computed(() => role.value.trim());
const roleValid = computed(() => trimmedRole.value.length >= 3 && trimmedRole.value.length <= 80);
const showRoleError = computed(() => roleTouched.value && !roleValid.value);
const canSubmit = computed(() => roleValid.value && personaId.value !== null);
const showSkeletons = computed(() => store.personas.length === 0 && store.pending);

onMounted(() => {
    void store.loadPersonas();
});

async function submit(): Promise<void> {
    roleTouched.value = true;
    const selected = personaId.value;
    if (!roleValid.value || selected === null || store.pending) {
        return;
    }

    const id = await store.start({
        role: trimmedRole.value,
        difficulty: difficulty.value,
        personaId: selected,
        questionCount: questionCount.value,
    });

    if (id !== null) {
        await router.push({ name: 'interview', params: { id } });
    }
}
</script>

<template>
    <main class="page">
        <header class="intro">
            <h1>The Interviewer</h1>
            <p>Practice with an AI interviewer that adapts to your answers.</p>
        </header>

        <form class="panel" novalidate @submit.prevent="submit">
            <div class="field">
                <label for="role">What role are you interviewing for?</label>
                <div class="input-shell">
                    <svg
                        class="input-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <input
                        id="role"
                        v-model="role"
                        type="text"
                        placeholder="e.g. Senior TypeScript Developer"
                        autocomplete="off"
                        :aria-invalid="showRoleError"
                        :aria-describedby="showRoleError ? 'role-error' : undefined"
                        @blur="roleTouched = true"
                    />
                </div>
                <p v-if="showRoleError" id="role-error" class="hint">
                    Enter a role between 3 and 80 characters.
                </p>
            </div>

            <div class="controls">
                <div class="field">
                    <span id="difficulty-label" class="label">Difficulty</span>
                    <div class="segmented" role="group" aria-labelledby="difficulty-label">
                        <button
                            v-for="option in DIFFICULTIES"
                            :key="option.value"
                            type="button"
                            :class="{ active: difficulty === option.value }"
                            :aria-pressed="difficulty === option.value"
                            @click="difficulty = option.value"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>

                <div class="field">
                    <span id="length-label" class="label">Length</span>
                    <div class="segmented" role="group" aria-labelledby="length-label">
                        <button
                            v-for="option in LENGTHS"
                            :key="option.value"
                            type="button"
                            :class="{ active: questionCount === option.value }"
                            :aria-pressed="questionCount === option.value"
                            @click="questionCount = option.value"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="field">
                <span id="persona-label" class="label">Select interviewer persona</span>
                <div class="personas" role="group" aria-labelledby="persona-label">
                    <template v-if="showSkeletons">
                        <div v-for="n in 4" :key="n" class="skeleton" />
                    </template>
                    <template v-else>
                        <PersonaCard
                            v-for="item in store.personas"
                            :key="item.id"
                            :persona="item"
                            :selected="personaId === item.id"
                            @select="personaId = $event"
                        />
                    </template>
                </div>
            </div>

            <ErrorBanner
                v-if="store.error"
                :message="store.error.message"
                @dismiss="store.dismissError()"
            />

            <button type="submit" class="start" :disabled="!canSubmit || store.pending">
                <span>{{ store.pending ? 'Starting…' : 'Start interview' }}</span>
                <span aria-hidden="true">→</span>
            </button>
        </form>
    </main>
</template>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-7) var(--space-6);
}

.intro {
    text-align: center;
}

h1 {
    margin: 0 0 var(--space-2);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.02em;
}

.intro p {
    margin: 0;
    color: var(--muted);
}

.panel {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-5);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
}

.panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent-soft), transparent 55%);
    border-radius: inherit;
    opacity: 0.5;
    pointer-events: none;
}

.panel > * {
    position: relative;
    z-index: 1;
}

.field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
}

.field > label,
.label {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    line-height: 1.4;
    text-transform: uppercase;
}

.input-shell {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0 var(--space-4);
    background: var(--field-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: border-color var(--transition);
}

.input-shell:focus-within {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

.input-icon {
    flex: none;
    color: var(--faint);
}

input {
    width: 100%;
    min-width: 0;
    padding: 14px 0;
    background: none;
    border: none;
    color: var(--text);
    font: inherit;
}

input::placeholder {
    color: var(--faint);
}

input:focus-visible {
    outline: none;
}

.hint {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
}

.controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-5);
}

.segmented {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-1);
    background: var(--field-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
}

.segmented button {
    flex: 1;
    min-width: 0;
    padding: var(--space-2) var(--space-1);
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--muted);
    font: inherit;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
    transition:
        background-color var(--transition),
        color var(--transition);
}

.segmented button:hover:not(.active) {
    color: var(--text);
}

.segmented button.active {
    background: var(--surface-raised);
    color: var(--text);
}

.personas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3);
}

.skeleton {
    height: 76px;
    background: var(--surface-raised);
    border-radius: var(--radius-sm);
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

.start {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: 48px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--accent-glow);
    color: #fff;
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color var(--transition),
        box-shadow var(--transition),
        opacity var(--transition),
        transform var(--transition);
}

.start:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 0 30px rgba(124, 108, 240, 0.5);
}

.start:active:not(:disabled) {
    transform: scale(0.98);
}

.start:disabled {
    box-shadow: none;
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 640px) {
    .page {
        padding: var(--space-6) var(--space-4);
    }

    .panel {
        padding: var(--space-4);
    }
}
</style>
