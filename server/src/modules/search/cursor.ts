import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { invalid } from "../../lib/errors.js";
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("base64url");
export class CursorCodec {
  constructor(private readonly secret: string) {
    if (Buffer.byteLength(secret) < 32)
      throw new Error("CURSOR_SECRET must contain at least 32 bytes.");
  }
  paginate<T>(
    items: T[],
    key: (item: T) => unknown,
    fingerprint: unknown,
    limit: number,
    cursor?: string,
  ): { items: T[]; nextCursor: string | null } {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw invalid("limit must be between 1 and 100.", "limit");
    const f = digest(["ranking-v1", fingerprint]);
    let start = 0;
    if (cursor) {
      try {
        if (
          cursor.length > 512 ||
          !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(cursor)
        )
          throw new Error();
        const [body, signature] = cursor.split(".") as [string, string];
        const expected = createHmac("sha256", this.secret)
          .update(body)
          .digest();
        const actual = Buffer.from(signature, "base64url");
        if (
          actual.length !== expected.length ||
          !timingSafeEqual(actual, expected)
        )
          throw new Error();
        const payload = JSON.parse(
          Buffer.from(body, "base64url").toString("utf8"),
        );
        if (payload.v !== 1 || payload.f !== f) throw new Error();
        const index = items.findIndex(
          (item) => digest(key(item)) === payload.k,
        );
        if (index < 0) throw new Error();
        start = index + 1;
      } catch {
        throw invalid(
          "This cursor is invalid or belongs to another search or data version.",
          "cursor",
        );
      }
    }
    const page = items.slice(start, start + limit);
    let nextCursor: string | null = null;
    if (page.length && start + page.length < items.length) {
      const body = Buffer.from(
        JSON.stringify({ v: 1, f, k: digest(key(page.at(-1)!)) }),
      ).toString("base64url");
      nextCursor = `${body}.${createHmac("sha256", this.secret).update(body).digest("base64url")}`;
    }
    return { items: page, nextCursor };
  }
}
