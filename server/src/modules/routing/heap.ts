export class MinHeap<T> {
  private readonly values: T[] = [];
  constructor(private readonly compare: (a: T, b: T) => number) {}
  push(value: T) {
    this.values.push(value);
    let i = this.values.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.values[parent]!, value) <= 0) break;
      this.values[i] = this.values[parent]!;
      i = parent;
    }
    this.values[i] = value;
  }
  pop(): T | undefined {
    const first = this.values[0],
      last = this.values.pop();
    if (this.values.length && last !== undefined) {
      let i = 0;
      while (i * 2 + 1 < this.values.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.values.length &&
          this.compare(this.values[child + 1]!, this.values[child]!) < 0
        )
          child++;
        if (this.compare(last, this.values[child]!) <= 0) break;
        this.values[i] = this.values[child]!;
        i = child;
      }
      this.values[i] = last;
    }
    return first;
  }
}
