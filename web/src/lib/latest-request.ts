/** One authority for map mutations from search, routing and chat. */
export class LatestRequest {
  private current: AbortController | null = null;
  invalidate() {
    this.current?.abort(
      new DOMException(
        "A newer map selection replaced this request.",
        "AbortError",
      ),
    );
    this.current = null;
  }
  start() {
    this.invalidate();
    const controller = new AbortController();
    this.current = controller;
    return {
      signal: controller.signal,
      isCurrent: () =>
        this.current === controller && !controller.signal.aborted,
    };
  }
}
