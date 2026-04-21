import { describe, expect, it, vi } from "vitest";
import {
  buildDocumentNumber,
  calculateTotal,
  calculateTotalTtc,
  calculateVatAmount,
  formatIsoDateForDocument,
  getTodayIsoDateString,
  splitAddressLines,
} from "./index";

describe("calculateTotal", () => {
  it("sums line totals", () => {
    expect(
      calculateTotal([
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 50 },
      ])
    ).toBe(250);
  });

  it("returns 0 for empty items", () => {
    expect(calculateTotal([])).toBe(0);
  });
});

describe("calculateVatAmount", () => {
  it("computes VAT from subtotal and rate", () => {
    expect(calculateVatAmount(100, 20)).toBe(20);
    expect(calculateVatAmount(100, 8.5)).toBe(8.5);
  });
});

describe("calculateTotalTtc", () => {
  it("adds subtotal HT and VAT", () => {
    expect(calculateTotalTtc(200, 20)).toBe(240);
  });
});

describe("formatIsoDateForDocument", () => {
  it("formats a fixed local calendar date", () => {
    expect(formatIsoDateForDocument(new Date(2026, 3, 20))).toBe("2026-04-20");
  });
});

describe("getTodayIsoDateString", () => {
  it("uses the current date from the system clock", () => {
    vi.useFakeTimers();
    // Local calendar date (not UTC) — matches formatIsoDateForDocument
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(getTodayIsoDateString()).toBe("2026-01-15");
    vi.useRealTimers();
  });
});

describe("buildDocumentNumber", () => {
  const marchFirst2026 = new Date(2026, 2, 1);

  it("builds quote number with trimmed prefix and date", () => {
    expect(
      buildDocumentNumber("quote", marchFirst2026, "DEV-", "FAC-")
    ).toBe("DEV-2026-03-01");
  });

  it("strips trailing hyphens from prefix before appending date", () => {
    expect(
      buildDocumentNumber("invoice", marchFirst2026, "DEV-", "FAC---")
    ).toBe("FAC-2026-03-01");
  });
});

describe("splitAddressLines", () => {
  it("splits on newlines and drops empty lines", () => {
    expect(splitAddressLines("Line 1\n\n  Line 2  \r\nLine 3")).toEqual([
      "Line 1",
      "Line 2",
      "Line 3",
    ]);
  });
});
