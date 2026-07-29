<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Verdict } from '@interviewer/shared';
import { useInterviewStore } from '../stores/interview';
import ScoreRing from '../components/ScoreRing.vue';
import ErrorBanner from '../components/ErrorBanner.vue';

const VERDICTS = {
    [Verdict.StrongHire]: { label: 'Strong hire', tone: 'good' },
    [Verdict.Hire]: { label: 'Hire', tone: 'good' },
    [Verdict.Borderline]: { label: 'Borderline', tone: 'mixed' },
    [Verdict.NoHire]: { label: 'No hire', tone: 'poor' },
} as const;

const store = useInterviewStore();
const route = useRoute();
const router = useRouter();

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const notFound = computed(() => store.report === null && store.error?.status === 404);
const verdict = computed(() => (store.report === null ? null : VERDICTS[store.report.verdict]));

onMounted(async () => {
    if (store.report === null) {
        await store.loadReport(id.value);
    }

    if (store.error?.status === 409) {
        await router.replace({ name: 'interview', params: { id: id.value } });
        return;
    }

    if (store.report !== null && store.interview?.id !== id.value) {
        await store.loadInterview(id.value);
    }
});

function toneOf(score: number): string {
    if (score >= 8) {
        return 'good';
    }
    return score >= 5 ? 'mixed' : 'poor';
}

async function restart(): Promise<void> {
    store.reset();
    await router.push({ name: 'setup' });
}
</script>

<template>
    <main class="page">
        <ErrorBanner
            v-if="store.error"
            :message="store.error.message"
            @dismiss="store.dismissError()"
        />

        <div v-if="notFound" class="empty">
            <span class="empty-emoji" aria-hidden="true">🔍</span>
            <p>This report could not be found.</p>
            <RouterLink to="/">Back to setup</RouterLink>
        </div>

        <template v-else-if="store.report && verdict">
            <header class="head">
                <ScoreRing :score="store.report.overallScore" />
                <div class="verdict">
                    <h1 class="badge" :class="verdict.tone">{{ verdict.label }}</h1>
                    <p v-if="store.interview" class="context">
                        {{ store.interview.role }} · {{ store.interview.questionCount }} questions ·
                        {{ store.interview.persona.emoji }} {{ store.interview.persona.name }}
                    </p>
                </div>
            </header>

            <section class="card summary">
                <span v-if="store.persona" class="byline" aria-hidden="true">
                    {{ store.persona.emoji }}
                </span>
                <p>{{ store.report.summary }}</p>
            </section>

            <div class="columns">
                <section class="card">
                    <h2>Strengths</h2>
                    <ul>
                        <li v-for="item in store.report.strengths" :key="item">
                            <span class="marker tick" aria-hidden="true">✓</span>
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </section>
                <section class="card">
                    <h2>Areas to improve</h2>
                    <ul>
                        <li v-for="item in store.report.improvements" :key="item">
                            <span class="marker arrow" aria-hidden="true">→</span>
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </section>
            </div>

            <section class="breakdown">
                <h2>Question by question</h2>
                <details v-for="turn in store.report.turns" :key="turn.question.index">
                    <summary>
                        <span class="index">{{
                            String(turn.question.index).padStart(2, '0')
                        }}</span>
                        <span class="question">{{ turn.question.text }}</span>
                        <span class="score" :class="toneOf(turn.evaluation.score)">
                            {{ turn.evaluation.score }}/10
                        </span>
                        <span class="chevron" aria-hidden="true">▾</span>
                    </summary>
                    <div class="detail">
                        <p class="full-question">{{ turn.question.text }}</p>
                        <blockquote>{{ turn.answerText }}</blockquote>
                        <div class="notes">
                            <div>
                                <h3>What worked</h3>
                                <ul>
                                    <li v-for="item in turn.evaluation.strengths" :key="item">
                                        <span class="marker tick" aria-hidden="true">✓</span>
                                        <span>{{ item }}</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3>What to improve</h3>
                                <ul>
                                    <li v-for="item in turn.evaluation.weaknesses" :key="item">
                                        <span class="marker arrow" aria-hidden="true">→</span>
                                        <span>{{ item }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </details>
            </section>

            <button type="button" class="again" @click="restart">Start another interview</button>
        </template>

        <div v-else class="loading" aria-hidden="true">
            <div class="head">
                <div class="skeleton ring" />
                <div class="skeleton bar" />
            </div>
            <div class="skeleton block" />
            <div class="columns">
                <div class="skeleton block" />
                <div class="skeleton block" />
            </div>
            <div class="skeleton row" />
            <div class="skeleton row" />
            <div class="skeleton row" />
        </div>
    </main>
</template>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-6) var(--space-7);
}

.head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-5);
}

.verdict {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
    min-width: 200px;
}

.badge {
    align-self: flex-start;
    margin: 0;
    padding: 5px 12px;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.3;
    text-transform: uppercase;
}

.context {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
}

.good {
    background: color-mix(in srgb, var(--success) 14%, transparent);
    color: var(--success);
}

.mixed {
    background: color-mix(in srgb, var(--warning) 14%, transparent);
    color: var(--warning);
}

.poor {
    background: color-mix(in srgb, var(--danger) 14%, transparent);
    color: var(--danger);
}

.card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
}

.summary {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-5);
}

.byline {
    font-size: 22px;
    line-height: 1.4;
}

.summary p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    text-wrap: pretty;
}

h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.4;
}

ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

li {
    display: flex;
    gap: 10px;
    font-size: 14px;
    line-height: 1.55;
}

.marker {
    flex: none;
}

.tick {
    color: var(--success);
}

.arrow {
    color: var(--warning);
}

.columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
}

.breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

details {
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

summary {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 14px var(--space-4);
    list-style: none;
    cursor: pointer;
}

summary::-webkit-details-marker {
    display: none;
}

.index {
    flex: none;
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.question {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.score {
    flex: none;
    padding: 3px 9px;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
}

.chevron {
    flex: none;
    color: var(--faint);
    font-size: 12px;
    transform: rotate(-90deg);
    transition: transform var(--transition);
}

details[open] .chevron {
    transform: rotate(0deg);
}

.detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: var(--space-4) var(--space-4) 18px;
    border-top: 1px solid var(--border);
}

.full-question {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
}

blockquote {
    margin: 0;
    padding-left: 14px;
    border-left: 2px solid var(--border);
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
}

.notes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-4);
}

.notes > div {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.notes ul {
    gap: var(--space-2);
}

.notes li {
    line-height: 1.5;
}

h3 {
    margin: 0;
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.4;
    text-transform: uppercase;
}

.again {
    height: 48px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color var(--transition),
        border-color var(--transition);
}

.again:hover {
    background: var(--surface);
    border-color: var(--faint);
}

.loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.skeleton {
    background: var(--surface);
    border-radius: var(--radius);
    animation: pulse 1.5s ease-in-out infinite;
}

.ring {
    flex: none;
    width: 96px;
    height: 96px;
    border-radius: 50%;
}

.bar {
    flex: 1;
    height: 20px;
    min-width: 200px;
}

.block {
    height: 140px;
}

.row {
    height: 48px;
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

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-7) 0;
    text-align: center;
}

.empty-emoji {
    font-size: 32px;
}

.empty p {
    margin: 0;
    color: var(--muted);
}

.empty a {
    color: var(--accent-bright);
}

@media (max-width: 640px) {
    .page {
        padding: var(--space-5) var(--space-4) var(--space-6);
    }

    .head {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .badge {
        align-self: center;
    }
}
</style>
