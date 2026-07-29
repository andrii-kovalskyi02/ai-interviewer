# The Interviewer

An AI mock interview coach. You pick a role, a difficulty and an interviewer persona, and the AI runs an adaptive technical interview: each question is informed by an evaluation of your previous answer. At the end you get a scored feedback report with strengths, areas to improve and a hiring verdict.

Personas include The Supportive Mentor, The Bar Raiser, The Startup CTO and Captain Redbeard, who conducts a rigorously technical interview entirely in pirate speak.

```
Setup  ->  Adaptive Q&A  ->  Report
role                        overall score
difficulty                  verdict
persona                     per question breakdown
```

## How to run

Requires Node 24 (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

Open http://localhost:5173. The backend listens on port 3001 and Vite proxies `/api` to it. If port 5173 is already taken, Vite will pick the next free one and print it, so check the startup output.

This works immediately with no LLM installed. `LLM_PROVIDER` defaults to `mock`, a deterministic interviewer that returns canned questions and heuristic scores, so the whole application is reviewable without any model setup.

### Running against a real LLM

```bash
ollama pull llama3.2:3b
cp apps/server/.env.example apps/server/.env
```

Set `LLM_PROVIDER=ollama` in `apps/server/.env`, then `npm run dev`.

| Variable          | Default                  | Meaning            |
| ----------------- | ------------------------ | ------------------ |
| `PORT`            | `3001`                   | API port           |
| `LLM_PROVIDER`    | `mock`                   | `mock` or `ollama` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint    |
| `OLLAMA_MODEL`    | `llama3.2:3b`            | model name         |

If Ollama is unreachable the API returns 503 with a message telling you exactly what to do, and the UI surfaces it rather than failing silently.

### Other commands

```bash
npm test          # 15 domain and prompt tests
npm run typecheck # all three workspaces
npm run format    # Prettier
```

## Model

Developed against **llama3.2:3b** through Ollama. It runs comfortably on a laptop and produces usable JSON, though its judgement is noticeably noisy: it occasionally scores a one word answer generously. **qwen2.5:7b** is a better choice if you have the memory, since the qwen family follows JSON schemas more reliably.

The architecture does not care which model runs. Both providers sit behind the same interface, and switching is one environment variable.

## Architecture

Hexagonal, with pragmatic DDD layering. Dependencies point inward only.

```
http            Fastify routes, DTO mapping, error to status mapping
  |
application     use cases: start interview, submit answer, get interview, get report
  |
domain          InterviewSession aggregate, entities, value objects, ports
  ^
infrastructure  Ollama client, mock interviewer, in memory repository
```

The domain imports nothing from Fastify, zod, fetch or any adapter. It is pure TypeScript plus shared enums, which is why the whole state machine is unit tested with no mocking library and no server.

### Key decisions

**The LLM is abstracted at two levels.** A low level `LlmClient` port speaks raw chat completion, and `OllamaClient` implements it. A high level `InterviewerGateway` port speaks the domain language: ask a question, evaluate an answer, write a report. `LlmInterviewer` bridges the two with prompt builders and zod validated JSON parsing. `MockInterviewer` implements the same gateway with no LLM at all, which is what makes zero setup review possible and keeps the tests fast.

**The report score and verdict are computed, not generated.** Early on the model was asked to average its own per question scores, and it simply invented numbers: three answers scored 8, 8 and 7 produced an overall of 7.6 with a "borderline" verdict. Now `InterviewSession.averageScore` does the arithmetic and `verdictForScore` applies fixed thresholds, so a report can never contradict the evaluations it is built from. The model contributes judgement and prose. The code contributes arithmetic and consistency.

**Evaluation is persona neutral, the report is persona voiced.** Captain Redbeard asks questions and writes the closing summary in character, but scoring uses a plain neutral evaluator prompt, so the persona cannot colour the marks. There is a test asserting the persona style instructions never appear in an evaluation prompt.

**Per question scores are hidden until the end.** `TurnDto` has no evaluation field at all, so it is structurally impossible for the API to leak a score mid interview. Only `ReportDto` exposes them.

**Zod guards both boundaries.** Incoming HTTP bodies are validated in `http/requestSchemas.ts`, and outgoing LLM JSON is validated in `infrastructure/llm/schemas.ts`. Untrusted input and untrusted model output get the same treatment.

**LLM output parsing normalises formatting and rejects only nonsense.** Small models get shape right far more often than they get limits right, so out of range scores are clamped, over long lists are truncated, empty lists are accepted and a missing topic label falls back to a default. What is rejected is genuinely unusable output: an invalid verdict, a missing required field, or a question that merely echoes its own topic label back as the question text.

**A failed parse is retried once, with the reason.** The first version of the retry told the model "your previous reply was not valid JSON", which was often false: the JSON was fine but a field was named `type` instead of `topic`. The model had no idea what to fix and repeated the mistake. The retry now feeds back the actual validation error and drops the temperature.

**Wiring is manual.** Every use case takes its ports through the constructor and `main.ts` is the single composition root where concrete classes are chosen. No DI container, because at this size one would hide the wiring that best demonstrates the architecture.

**Types are shared, not duplicated.** `packages/shared` holds every DTO and is consumed as raw TypeScript, with no build step, because both the server (tsx) and the web app (Vite) compile TypeScript themselves. The frontend and backend cannot drift.

## Trade offs

**Sessions live in memory.** A `Map` behind an `InterviewRepository` port. Restarting the server loses interviews. Persistence was out of scope for the time budget, and swapping in SQLite means writing one adapter and changing one line in the composition root.

**No streaming.** Answers arrive as a single response, which with a local model means a six to ten second wait. A typing indicator covers the gap. Token streaming over SSE is the obvious next step.

**The shared package ships raw TypeScript.** Convenient here, but it would need a build step if a plain JavaScript consumer ever imported it.

**Small models are noisy graders.** The rubric has explicit anchors and the arithmetic is deterministic, but a 3B model still produces the occasional odd score. A larger model or an ensemble of evaluations would tighten it.

**No auth, no rate limiting, permissive CORS.** All appropriate for a local review build, none of it production ready.

**TypeScript is pinned to 6.x.** TypeScript 7 is out, but `vue-tsc` and Volar reach into compiler internals that the native port relocated, so type checking the Vue app breaks on it. Pinning to the newest version the whole toolchain supports beat chasing the highest number.

## What I would build next

- Token streaming over SSE so questions and reports appear as they are written
- A SQLite `InterviewRepository` adapter, plus an interview history page
- An `AnthropicClient` as a second `LlmClient`, which would prove the port abstraction rather than merely asserting it
- Surfacing `followUpHint` as an optional in interview nudge, since the data is already produced and currently only feeds the next prompt
- Playwright coverage of the full browser flow
- Structured evaluation caching, so re running a report does not re invoke the model

## Project layout

```
packages/shared/          API contract types, shared enums and error codes
apps/server/
  src/domain/             aggregate, entities, value objects, ports, rule messages
  src/application/        use cases
  src/infrastructure/     Ollama client, LLM and mock gateways, prompts, repository
  src/http/               Fastify server, routes, DTO mappers, request schemas
apps/web/
  src/api/                typed fetch client
  src/stores/             Pinia store
  src/views/              setup, interview, report
  src/components/         persona card, chat message, typing indicator, score ring
```

## Tests

```bash
npm test
```

15 tests, all of which run without a server, a database or an LLM:

- `InterviewSession` state machine: every guard, asserted against the specific rule that should fire rather than just the error type
- Prompt construction: that the next question prompt carries the prior answer and the private evaluator note, and that the evaluation prompt stays persona neutral

## API

| Method | Path                          | Returns              |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/personas`               | `PersonaDto[]`       |
| POST   | `/api/interviews`             | `InterviewDto` (201) |
| GET    | `/api/interviews/:id`         | `InterviewDto`       |
| POST   | `/api/interviews/:id/answers` | `InterviewDto`       |
| GET    | `/api/interviews/:id/report`  | `ReportDto`          |

Errors always return `{ error: { code, message } }`. Domain errors map to status codes in one place: not found to 404, invalid state to 409, other domain errors to 422, request validation to 400, LLM unavailable to 503.
