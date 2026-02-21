import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module under test
vi.mock("../lib/supabase.js", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock("../lib/logger.js", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

vi.mock("@sheila/shared/constants", () => ({
  STORAGE_BUCKET: "test-bucket",
}));

vi.mock("pdf-parse", () => {
  return {
    PDFParse: vi.fn().mockImplementation(() => ({
      getText: vi.fn().mockResolvedValue({ text: "Extracted PDF text content" }),
      destroy: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({ data: { text: "OCR extracted text" } }),
    terminate: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { extractTextFromStorage } from "../lib/extractText.js";
import { supabase } from "../lib/supabase.js";

function mockDownload(data: ArrayBuffer | null, error: Error | null = null) {
  const blob = data ? { arrayBuffer: () => Promise.resolve(data) } : null;
  (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
    download: vi.fn().mockResolvedValue({ data: blob, error }),
  });
}

describe("extractTextFromStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts text from PDF files", async () => {
    const buffer = new ArrayBuffer(10);
    mockDownload(buffer);

    const result = await extractTextFromStorage("docs/test.pdf", "application/pdf");
    expect(result).toBe("Extracted PDF text content");
  });

  it("extracts text from image files via OCR", async () => {
    const buffer = new ArrayBuffer(10);
    mockDownload(buffer);

    const result = await extractTextFromStorage("docs/test.jpg", "image/jpeg");
    expect(result).toBe("OCR extracted text");
  });

  it("returns empty string for unsupported mime types", async () => {
    const result = await extractTextFromStorage("docs/test.zip", "application/zip");
    expect(result).toBe("");
  });

  it("returns empty string on download error", async () => {
    mockDownload(null, new Error("Download failed"));

    const result = await extractTextFromStorage("docs/test.pdf", "application/pdf");
    expect(result).toBe("");
  });

  it("returns empty string on image download error", async () => {
    mockDownload(null, new Error("Download failed"));

    const result = await extractTextFromStorage("docs/test.png", "image/png");
    expect(result).toBe("");
  });
});
