// Deterministic display metadata for marketplace agents (version, run count, and
// credits per run). Derived from the agent id so each agent shows stable,
// plausible numbers across renders — illustrative stand-ins for real telemetry.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export const agentVersion = (id: string): number => 6 + (hash('v|' + id) % 9);        // v6–v14
export const agentRuns = (id: string): number => 18 + (hash('r|' + id) % 800);         // 18–817
export const agentCreditsPerRun = (id: string): number => 5 + (hash('c|' + id) % 66);  // 5–70
export const agentRecency = (id: string): number => hash('new|' + id);                 // pseudo "newness" for the New sort
