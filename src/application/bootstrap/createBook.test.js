import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit-level contract: book meta shape must never be fabricated by UI rules.
 */
function buildBookFromHost(data) {
  const bookId = data?.id || data?.bookId;
  if (!bookId || !data?.baseCurrency) return null;
  return {
    id: bookId,
    name: data.name || "Personal Book",
    baseCurrency: data.baseCurrency,
    createdAt: data.createdAt || "",
  };
}

describe("book identity BUG-P1-14", () => {
  it("rejects missing id — no db:name fabrication", () => {
    assert.equal(buildBookFromHost({ name: "My Book", baseCurrency: "IRR" }), null);
  });

  it("uses persisted id and createdAt", () => {
    const b = buildBookFromHost({
      id: "uuid-stable-1",
      name: "خانه",
      baseCurrency: "IRR",
      createdAt: "2026-01-15T10:00:00.000Z",
    });
    assert.equal(b.id, "uuid-stable-1");
    assert.equal(b.createdAt, "2026-01-15T10:00:00.000Z");
    assert.notEqual(b.id.startsWith("db:"), true);
  });

  it("accepts bookId alias", () => {
    const b = buildBookFromHost({ bookId: "b2", baseCurrency: "USD", name: "X" });
    assert.equal(b.id, "b2");
  });
});
