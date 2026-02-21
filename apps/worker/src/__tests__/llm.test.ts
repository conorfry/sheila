import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock the Anthropic SDK
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

vi.mock("../lib/logger.js", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe("classifyDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns filename-based guess when CLAUDE_API_KEY is not set", async () => {
    delete process.env.CLAUDE_API_KEY;
    // Re-import to get fresh module state
    vi.resetModules();
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: mockCreate },
      })),
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
    const { classifyDocument } = await import("../lib/llm.js");

    const result = await classifyDocument("some text", "my_passport_scan.pdf");
    expect(result.document_type).toBe("passport");
    expect(result.confidence).toBe(0.5);
    expect(result.reasons).toContain("No LLM available");
  });

  it("guesses birth_certificate from filename", async () => {
    delete process.env.CLAUDE_API_KEY;
    vi.resetModules();
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: mockCreate },
      })),
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
    const { classifyDocument } = await import("../lib/llm.js");

    const result = await classifyDocument("text", "birth_cert.pdf");
    expect(result.document_type).toBe("birth_certificate");
  });

  it("guesses degree_certificate from filename", async () => {
    delete process.env.CLAUDE_API_KEY;
    vi.resetModules();
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: mockCreate },
      })),
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
    const { classifyDocument } = await import("../lib/llm.js");

    const result = await classifyDocument("text", "degree_certificate.pdf");
    expect(result.document_type).toBe("degree_certificate");
  });

  it("returns 'other' for unrecognised filename", async () => {
    delete process.env.CLAUDE_API_KEY;
    vi.resetModules();
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: mockCreate },
      })),
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
    const { classifyDocument } = await import("../lib/llm.js");

    const result = await classifyDocument("text", "random_file.pdf");
    expect(result.document_type).toBe("other");
  });
});

describe("extractFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns empty extraction when CLAUDE_API_KEY is not set", async () => {
    delete process.env.CLAUDE_API_KEY;
    vi.resetModules();
    vi.mock("@anthropic-ai/sdk", () => ({
      default: vi.fn().mockImplementation(() => ({
        messages: { create: mockCreate },
      })),
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
    const { extractFields } = await import("../lib/llm.js");

    const schema = z.object({ full_name: z.string() });
    const result = await extractFields("doc text", "passport", schema);
    expect(result.fields).toBeNull();
    expect(result.errors).toContain("No LLM available");
  });
});
