export interface Sink { emit: (event: { type: string; at: number; data?: unknown }) => void }
export const ConsoleSink: Sink = { emit: (e) => console.log(`[SINK ${new Date(e.at).toISOString()}] ${e.type}`, e.data ?? "") }
