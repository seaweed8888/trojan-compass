import { setImmediate } from "node:timers/promises";
import type { RequestScope } from "../ports/service-ports.js";
import { timeout } from "./errors.js";

export function checkScope(scope: RequestScope): void {
  if (scope.signal?.aborted)
    throw scope.signal.reason instanceof Error
      ? scope.signal.reason
      : timeout();
  if (scope.deadline !== undefined && performance.now() >= scope.deadline)
    throw timeout();
}

/** Yield during expensive work so disconnects and shutdown can be observed. */
export async function checkpoint(
  scope: RequestScope,
  iteration: number,
): Promise<void> {
  checkScope(scope);
  if (iteration % 256 === 0) {
    await setImmediate();
    checkScope(scope);
  }
}

export async function withinScope<T>(
  scope: RequestScope,
  work: Promise<T>,
): Promise<T> {
  checkScope(scope);
  if (!scope.signal) return work;
  const signal = scope.signal;
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () =>
      reject(signal.reason instanceof Error ? signal.reason : timeout());
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  try {
    return await Promise.race([work, aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
