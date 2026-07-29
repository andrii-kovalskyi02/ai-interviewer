<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInterviewStore } from '../stores/interview';
import ChatMessage from '../components/ChatMessage.vue';
import TypingIndicator from '../components/TypingIndicator.vue';
import ProgressDots from '../components/ProgressDots.vue';
import ErrorBanner from '../components/ErrorBanner.vue';

const store = useInterviewStore();
const route = useRoute();
const router = useRouter();

const draft = ref('');
const transcript = ref<HTMLElement | null>(null);
const inFlight = ref<{ text: string; answeredBefore: number } | null>(null);

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const turns = computed(() => store.interview?.turns ?? []);
const notFound = computed(() => store.interview === null && store.error?.status === 404);
const canSend = computed(() => draft.value.trim().length > 0 && !store.pending);

const optimisticAnswer = computed(() => {
    const sent = inFlight.value;
    if (sent === null || store.answeredCount !== sent.answeredBefore) {
        return null;
    }
    return sent.text;
});

onMounted(() => {
    if (store.interview?.id !== id.value) {
        void store.loadInterview(id.value);
    }
});

const settled = ref(false);

function scrollBehavior(): ScrollBehavior {
    if (!settled.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'auto';
    }
    return 'smooth';
}

watch(
    [() => turns.value.length, () => store.pending],
    async () => {
        await nextTick();
        const element = transcript.value;
        if (element === null) {
            return;
        }
        element.scrollTo({ top: element.scrollHeight, behavior: scrollBehavior() });
        settled.value = turns.value.length > 0;
    },
    { immediate: true },
);

async function send(): Promise<void> {
    const text = draft.value.trim();
    if (text.length === 0 || store.pending) {
        return;
    }
    draft.value = '';
    inFlight.value = { text, answeredBefore: store.answeredCount };

    await store.answer(text);

    const failed = store.error !== null;
    inFlight.value = null;

    if (failed) {
        draft.value = text;
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void send();
    }
}
</script>

<template>
    <div class="screen">
        <div v-if="notFound" class="empty">
            <span class="empty-emoji" aria-hidden="true">🔍</span>
            <p>This interview could not be found.</p>
            <RouterLink to="/">Back to setup</RouterLink>
        </div>

        <template v-else-if="store.interview">
            <header class="bar">
                <div class="bar-inner">
                    <div class="who">
                        <button
                            type="button"
                            class="leave"
                            aria-label="Leave interview"
                            @click="router.push({ name: 'setup' })"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                aria-hidden="true"
                            >
                                <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                        </button>
                        <span class="avatar" aria-hidden="true">{{
                            store.interview.persona.emoji
                        }}</span>
                        <span class="identity">
                            <span class="name">{{ store.interview.persona.name }}</span>
                            <span class="meta">
                                {{ store.interview.role }} · {{ store.interview.difficulty }}
                            </span>
                        </span>
                    </div>
                    <ProgressDots
                        :total="store.interview.questionCount"
                        :answered="store.answeredCount"
                    />
                </div>
            </header>

            <main ref="transcript" class="transcript">
                <div class="thread" role="log" aria-live="polite">
                    <div v-for="turn in turns" :key="turn.question.index" class="turn">
                        <div class="ask">
                            <span class="topic">{{ turn.question.topic }}</span>
                            <ChatMessage role="interviewer" :text="turn.question.text" />
                        </div>
                        <ChatMessage
                            v-if="turn.answerText"
                            role="candidate"
                            :text="turn.answerText"
                        />
                    </div>

                    <ChatMessage
                        v-if="optimisticAnswer"
                        role="candidate"
                        :text="optimisticAnswer"
                    />

                    <TypingIndicator v-if="store.pending" :name="store.interview.persona.name" />

                    <ErrorBanner
                        v-if="store.error"
                        :message="store.error.message"
                        @dismiss="store.dismissError()"
                    />

                    <section v-if="store.isCompleted" class="done">
                        <span class="done-mark" aria-hidden="true">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8.5 12.5l2.5 2.5 4.5-5" />
                            </svg>
                        </span>
                        <h2>Interview complete</h2>
                        <p>
                            {{ store.interview.persona.name }} has finished assessing your answers.
                            Your performance report is ready.
                        </p>
                        <RouterLink
                            class="report-link"
                            :to="{ name: 'report', params: { id: store.interview.id } }"
                        >
                            See your report <span aria-hidden="true">→</span>
                        </RouterLink>
                    </section>
                </div>
            </main>

            <footer v-if="!store.isCompleted" class="composer">
                <div class="composer-inner">
                    <div class="shell">
                        <label class="sr-only" for="answer">Your answer</label>
                        <div class="grow" :data-value="draft">
                            <textarea
                                id="answer"
                                v-model="draft"
                                rows="1"
                                placeholder="Type your answer…"
                                @keydown="onKeydown"
                            />
                        </div>
                        <button
                            type="button"
                            class="send"
                            aria-label="Send answer"
                            :disabled="!canSend"
                            @click="send"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.4"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                    <p class="tip">Enter to send · Shift+Enter for a new line</p>
                </div>
            </footer>
        </template>
    </div>
</template>

<style scoped>
.screen {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: minmax(0, 1fr);
    height: 100dvh;
    overflow: hidden;
}

.bar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
}

.bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    max-width: 820px;
    margin: 0 auto;
    padding: var(--space-3) var(--space-5);
}

.who {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
}

.leave {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--muted);
    cursor: pointer;
    transition:
        background-color var(--transition),
        color var(--transition);
}

.leave:hover {
    background: var(--surface-raised);
    color: var(--text);
}

.avatar {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
}

.identity {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.name {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
}

.meta {
    overflow: hidden;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.2;
    text-overflow: ellipsis;
    text-transform: capitalize;
    white-space: nowrap;
}

.transcript {
    overflow-y: auto;
}

.thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 820px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
}

.turn {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.ask {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
}

.topic {
    padding: 4px var(--space-2);
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft);
    border-radius: 6px;
    color: var(--accent-bright);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.05em;
    line-height: 1.4;
    text-transform: uppercase;
}

.done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    max-width: 420px;
    margin: var(--space-4) auto var(--space-6);
    padding: var(--space-5);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    text-align: center;
}

.done-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft);
    border-radius: 50%;
    color: var(--accent-bright);
}

.done h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.done p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.55;
}

.report-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3);
    background: var(--accent-bright);
    border-radius: var(--radius-sm);
    color: var(--on-accent-bright);
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition:
        background-color var(--transition),
        transform var(--transition);
}

.report-link:hover {
    background: #e4dfff;
}

.report-link:active {
    transform: scale(0.98);
}

.composer {
    background: var(--surface);
    border-top: 1px solid var(--border);
}

.composer-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 820px;
    margin: 0 auto;
    padding: var(--space-4) var(--space-5);
}

.shell {
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: border-color var(--transition);
}

.shell:focus-within {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

.grow {
    display: grid;
    flex: 1;
    min-width: 0;
}

.grow::after,
.grow textarea {
    grid-area: 1 / 1 / 2 / 2;
    max-height: 170px;
    padding: var(--space-2) 0;
    overflow-y: auto;
    border: none;
    font: inherit;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.grow::after {
    content: attr(data-value) ' ';
    visibility: hidden;
}

textarea {
    width: 100%;
    background: none;
    color: var(--text);
    resize: none;
}

textarea::placeholder {
    color: var(--faint);
}

textarea:focus-visible {
    outline: none;
}

.send {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--accent-bright);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--on-accent-bright);
    cursor: pointer;
    transition:
        background-color var(--transition),
        opacity var(--transition),
        transform var(--transition);
}

.send:hover:not(:disabled) {
    background: #e4dfff;
}

.send:active:not(:disabled) {
    transform: scale(0.95);
}

.send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tip {
    margin: 0;
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: center;
}

.empty {
    grid-row: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-6);
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

@media (max-width: 640px) {
    .bar-inner,
    .composer-inner {
        padding-right: var(--space-4);
        padding-left: var(--space-4);
    }

    .thread {
        padding: var(--space-5) var(--space-4);
    }
}
</style>
