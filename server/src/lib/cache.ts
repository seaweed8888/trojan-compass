/** Bounded single-flight cache. A caller's cancellation never cancels shared preparation. */
export class AsyncCache<T> {
  private readonly values = new Map<string, Promise<T>>();
  constructor(private readonly capacity = 8) {}
  get(key: string, prepare: () => Promise<T>): Promise<T> {
    const existing = this.values.get(key);
    if (existing) {
      this.values.delete(key);
      this.values.set(key, existing);
      return existing;
    }
    const promise = Promise.resolve().then(prepare);
    this.values.set(key, promise);
    if (this.values.size > this.capacity)
      this.values.delete(this.values.keys().next().value!);
    void promise.catch(() => {
      if (this.values.get(key) === promise) this.values.delete(key);
    });
    return promise;
  }
  clear() {
    this.values.clear();
  }
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
