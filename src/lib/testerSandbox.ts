export type TesterSandboxMode = "create" | "update" | "delete";

export type TesterSandboxRecord = {
  id: string;
  model: string;
  mode: TesterSandboxMode;
  payload: unknown;
  message: string;
  createdAt: string;
};

const SANDBOX_STORAGE_KEY = "maison-nova-tester-sandbox-records";

function readRecords(): TesterSandboxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TesterSandboxRecord[];
  } catch {
    return [];
  }
}

function writeRecords(records: TesterSandboxRecord[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(records));
}

export function storeTesterSimulation(
  model: string,
  mode: TesterSandboxMode,
  payload: unknown,
  message: string,
) {
  const records = readRecords();
  const next: TesterSandboxRecord = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    model,
    mode,
    payload,
    message,
    createdAt: new Date().toISOString(),
  };

  writeRecords([next, ...records].slice(0, 80));
  return next;
}

export function getTesterSandboxRecords() {
  return readRecords();
}

export function clearTesterSandboxRecords() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SANDBOX_STORAGE_KEY);
}

export async function runTesterSafeWrite<T>(
  isTester: boolean,
  model: string,
  mode: TesterSandboxMode,
  payload: unknown,
  message: string,
  write: () => Promise<T>,
): Promise<T | undefined> {
  if (isTester) {
    storeTesterSimulation(model, mode, payload, message);
    return undefined as unknown as T;
  }

  return await write();
}
