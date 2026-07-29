import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
    InterviewStatus,
    type InterviewDto,
    type PersonaDto,
    type ReportDto,
    type StartInterviewRequest,
} from '@interviewer/shared';
import * as api from '../api/client';
import { ApiClientError } from '../api/client';

export const useInterviewStore = defineStore('interview', () => {
    const personas = ref<PersonaDto[]>([]);
    const interview = ref<InterviewDto | null>(null);
    const report = ref<ReportDto | null>(null);
    const pending = ref(false);

    const error = ref<ApiClientError | null>(null);

    const answeredCount = computed(
        () => interview.value?.turns.filter((turn) => turn.answerText !== undefined).length ?? 0,
    );

    const progress = computed(() => {
        const current = interview.value;
        if (current === null || current.questionCount === 0) {
            return 0;
        }
        return answeredCount.value / current.questionCount;
    });

    const isCompleted = computed(() => interview.value?.status === InterviewStatus.Completed);

    const persona = computed(() => interview.value?.persona ?? null);

    async function run<T>(operation: () => Promise<T>): Promise<T | null> {
        pending.value = true;
        error.value = null;
        try {
            return await operation();
        } catch (err) {
            error.value =
                err instanceof ApiClientError
                    ? err
                    : new ApiClientError('unknown', 'Something went wrong', 0);
            return null;
        } finally {
            pending.value = false;
        }
    }

    async function loadPersonas(): Promise<void> {
        const loaded = await run(() => api.fetchPersonas());
        if (loaded !== null) {
            personas.value = loaded;
        }
    }

    async function start(payload: StartInterviewRequest): Promise<string | null> {
        const started = await run(() => api.startInterview(payload));
        if (started === null) {
            return null;
        }
        interview.value = started;
        report.value = null;
        return started.id;
    }

    async function answer(text: string): Promise<void> {
        const current = interview.value;
        if (current === null) {
            return;
        }
        const updated = await run(() => api.submitAnswer(current.id, { text }));
        if (updated !== null) {
            interview.value = updated;
        }
    }

    async function loadInterview(id: string): Promise<void> {
        const loaded = await run(() => api.getInterview(id));
        if (loaded !== null) {
            interview.value = loaded;
        }
    }

    async function loadReport(id: string): Promise<void> {
        const loaded = await run(() => api.getReport(id));
        if (loaded !== null) {
            report.value = loaded;
        }
    }

    function dismissError(): void {
        error.value = null;
    }

    function reset(): void {
        interview.value = null;
        report.value = null;
        error.value = null;
    }

    return {
        personas,
        interview,
        report,
        pending,
        error,
        answeredCount,
        progress,
        isCompleted,
        persona,
        loadPersonas,
        start,
        answer,
        loadInterview,
        loadReport,
        dismissError,
        reset,
    };
});
