import { LlmProvider, loadConfig } from './config.js';
import { InMemoryInterviewRepository } from './infrastructure/persistence/InMemoryInterviewRepository.js';
import type { InterviewerGateway } from './domain/interview/ports.js';
import { LlmInterviewer } from './infrastructure/llm/LlmInterviewer.js';
import { OllamaClient } from './infrastructure/llm/OllamaClient.js';
import { MockInterviewer } from './infrastructure/llm/MockInterviewer.js';
import { buildServer } from './http/buildServer.js';
import { StartInterviewUseCase } from './application/StartInterviewUseCase.js';
import { SubmitAnswerUseCase } from './application/SubmitAnswerUseCase.js';
import { GetInterviewUseCase } from './application/GetInterviewUseCase.js';
import { GetReportUseCase } from './application/GetReportUseCase.js';

const config = loadConfig();
const repository = new InMemoryInterviewRepository();

const interviewer: InterviewerGateway =
    config.llm.provider === LlmProvider.Ollama
        ? new LlmInterviewer(
              new OllamaClient({ baseUrl: config.llm.baseUrl, model: config.llm.model }),
          )
        : new MockInterviewer();

const app = await buildServer({
    start: new StartInterviewUseCase(repository, interviewer),
    submitAnswer: new SubmitAnswerUseCase(repository, interviewer),
    getInterview: new GetInterviewUseCase(repository),
    getReport: new GetReportUseCase(repository),
});

await app.listen({ port: config.port, host: '0.0.0.0' });

app.log.info(`LLM provider: ${config.llm.provider}`);
