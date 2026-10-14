export type ToolCall = { id: string; name: string; arguments: unknown };
export type Message = { role: 'system'|'user'|'assistant'|'tool'; content: string; toolCalls?: ToolCall[]; toolCallId?: string };
export type Reply = { content: string; toolCalls: ToolCall[]; stop: 'complete'|'tool'|'truncated' };
export type ToolSpec = { name: string; description: string; parameters: Record<string, unknown> };
export interface Client { kind: 'offline'|'local'|'cloud'; respond(messages: Message[], tools: ToolSpec[]): Promise<Reply> }
export type Evaluation = { passed: boolean; output: string; source: string };
export type AgentResult = { status: 'complete'|'limit'; messages: Message[]; turns: number };
export type Lesson = { attempt: number; feedback: string; lesson: string };
export type AttemptResult = { passed: boolean; attempts: number; lessons: Lesson[]; evaluation: Evaluation };
export type ChildBrief = { role: 'explorer'; objective: string; sourcePath: 'src/slugify.ts'; acceptance: string[]; maxTurns: number };
export type ChildReport = { role: 'explorer'; summary: string; evidence: { path: 'src/slugify.ts'; observation: string }[]; recommendation: string };
export class IncompleteError extends Error {}
export class ProtocolError extends Error {}
