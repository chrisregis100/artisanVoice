import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  shareViaWhatsApp,
  shareWithPDF,
  canUseNativeShare,
  canShareFiles,
  type ShareMethod,
} from "./share";

// Mock the pdf module
vi.mock("./pdf", () => ({
  generatePDF: vi.fn().mockResolvedValue(new Blob(["test"], { type: "application/pdf" })),
  downloadPDF: vi.fn(),
  generateFilename: vi.fn().mockReturnValue("test-filename.pdf"),
}));

// Mock the utils index
vi.mock("@/lib/utils", () => ({
  calculateTotalTtc: vi.fn().mockReturnValue(120),
  calculateVatAmount: vi.fn().mockReturnValue(20),
}));

const mockShareParams = {
  customerName: "John Doe",
  customerPhone: "01 23 45 67 89",
  items: [{ id: "1", description: "Item 1", quantity: 1, unitPrice: 100 }],
  total: 100,
  type: "quote" as const,
  businessName: "Test Business",
  businessPhone: "+229 98 76 54 32",
  documentDate: new Date("2026-01-15"),
  quotePrefix: "DEV-",
  invoicePrefix: "FAC-",
  vatRatePercent: 20,
};

describe("shareViaWhatsApp", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { open: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates WhatsApp URL with formatted phone number", async () => {
    await shareViaWhatsApp(mockShareParams, "01 23 45 67 89");

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/229123456789"),
      "_blank"
    );
  });

  it("handles phone numbers already with country code", async () => {
    await shareViaWhatsApp(mockShareParams, "+229123456789");

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/229123456789"),
      "_blank"
    );
  });

  it("generates URL without phone number when not provided", async () => {
    await shareViaWhatsApp(mockShareParams);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank"
    );
  });

  it("encodes message in URL", async () => {
    await shareViaWhatsApp(mockShareParams, "+229123456789");

    const callArg = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg).toContain("text=");
    expect(callArg).toContain(encodeURIComponent("Devis de Test Business"));
  });

  it("formats invoice type correctly", async () => {
    const invoiceParams = { ...mockShareParams, type: "invoice" as const };
    await shareViaWhatsApp(invoiceParams, "+229123456789");

    const callArg = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg).toContain(encodeURIComponent("Facture de Test Business"));
  });
});

describe("canUseNativeShare", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when navigator.share is available", () => {
    vi.stubGlobal("navigator", { share: vi.fn() });
    expect(canUseNativeShare()).toBe(true);
  });

  it("returns false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(canUseNativeShare()).toBe(false);
  });

  it("returns false when navigator.share is not available", () => {
    vi.stubGlobal("navigator", {});
    expect(canUseNativeShare()).toBe(false);
  });
});

describe("canShareFiles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when navigator.canShare supports files", () => {
    const mockCanShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: mockCanShare,
    });
    expect(canShareFiles()).toBe(true);
    expect(mockCanShare).toHaveBeenCalledWith({
      files: [expect.any(File)],
    });
  });

  it("returns false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(canShareFiles()).toBe(false);
  });

  it("returns false when navigator.share is not available", () => {
    vi.stubGlobal("navigator", { canShare: vi.fn() });
    expect(canShareFiles()).toBe(false);
  });

  it("returns false when navigator.canShare is not available", () => {
    vi.stubGlobal("navigator", { share: vi.fn() });
    expect(canShareFiles()).toBe(false);
  });

  it("returns false when canShare returns false for files", () => {
    const mockCanShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: mockCanShare,
    });
    expect(canShareFiles()).toBe(false);
  });
});

describe("shareWithPDF", () => {
  const { downloadPDF, generatePDF } = vi.hoisted(() => ({
    downloadPDF: vi.fn(),
    generatePDF: vi.fn().mockResolvedValue(new Blob(["test"])),
  }));

  beforeEach(() => {
    vi.stubGlobal("window", { open: vi.fn() });
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("downloads PDF when method is 'download'", async () => {
    const { downloadPDF: mockDownload } = await import("./pdf");
    await shareWithPDF(mockShareParams, "download");
    expect(mockDownload).toHaveBeenCalled();
  });

  it("uses native share when method is 'native' and sharing is supported", async () => {
    await shareWithPDF(mockShareParams, "native");
    expect(navigator.share).toHaveBeenCalled();
  });

  it("falls back to download when native share is not supported", async () => {
    const { downloadPDF: mockDownload } = await import("./pdf");
    vi.stubGlobal("navigator", { share: undefined, canShare: undefined });
    await shareWithPDF(mockShareParams, "native");
    expect(mockDownload).toHaveBeenCalled();
  });

  it("downloads PDF and opens WhatsApp when method is 'whatsapp'", async () => {
    const { downloadPDF: mockDownload } = await import("./pdf");

    const sharePromise = shareWithPDF(mockShareParams, "whatsapp");

    expect(mockDownload).toHaveBeenCalled();

    // Fast-forward past the 500ms delay
    await vi.advanceTimersByTimeAsync(500);
    await sharePromise;

    expect(window.open).toHaveBeenCalled();
  });

  it("falls back to download when canShare returns false", async () => {
    const { downloadPDF: mockDownload } = await import("./pdf");
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: vi.fn().mockReturnValue(false),
    });
    await shareWithPDF(mockShareParams, "native");
    expect(mockDownload).toHaveBeenCalled();
    expect(navigator.share).not.toHaveBeenCalled();
  });
});
