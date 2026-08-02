export class DreamSeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state =
      typeof seed === "number" ? seed >>> 0 : DreamSeededRandom.hash(seed);
    if (this.state === 0) this.state = 0x6d2b79f5;
  }

  static hash(value: string) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  next() {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number) {
    return min + (max - min) * this.next();
  }

  integer(min: number, max: number) {
    return Math.floor(this.range(min, max + 1));
  }
}
