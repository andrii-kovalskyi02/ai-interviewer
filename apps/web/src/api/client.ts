import type {
    ApiError,
    InterviewDto,
    PersonaDto,
    ReportDto,
    StartInterviewRequest,
    SubmitAnswerRequest,
} from '@interviewer/shared';

export class ApiClientError extends Error {
    constructor(
        readonly code: string,
        message: string,
        readonly status: number,
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

function isApiError(body: unknown): body is ApiError {
    if (typeof body !== 'object' || body === null || !('error' in body)) {
        return false;
    }
    const error: unknown = body.error;
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        typeof error.code === 'string' &&
        typeof error.message === 'string'
    );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;

    try {
        response = await fetch(path, init);
    } catch {
        throw new ApiClientError('network', 'Could not reach the server', 0);
    }

    if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        if (isApiError(body)) {
            throw new ApiClientError(body.error.code, body.error.message, response.status);
        }
        throw new ApiClientError('unknown', 'Something went wrong', response.status);
    }

    return (await response.json()) as T;
}

function jsonRequest<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export function fetchPersonas(): Promise<PersonaDto[]> {
    return request<PersonaDto[]>('/api/personas');
}

export function startInterview(body: StartInterviewRequest): Promise<InterviewDto> {
    return jsonRequest<InterviewDto>('/api/interviews', body);
}

export function getInterview(id: string): Promise<InterviewDto> {
    return request<InterviewDto>(`/api/interviews/${encodeURIComponent(id)}`);
}

export function submitAnswer(id: string, body: SubmitAnswerRequest): Promise<InterviewDto> {
    return jsonRequest<InterviewDto>(`/api/interviews/${encodeURIComponent(id)}/answers`, body);
}

export function getReport(id: string): Promise<ReportDto> {
    return request<ReportDto>(`/api/interviews/${encodeURIComponent(id)}/report`);
}
