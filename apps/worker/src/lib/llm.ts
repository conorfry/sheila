import Anthropic from "@anthropic-ai/sdk";
import { z, type ZodSchema } from "zod";
import { logger } from "./logger.js";

const log = logger.child({ module: "llm" });

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

// -- Document classification --

const classificationSchema = z.object({
  document_type: z.string(),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
});

export type ClassificationResult = z.infer<typeof classificationSchema>;

/**
 * Classifies a document based on its extracted text.
 * Returns deterministic defaults when CLAUDE_API_KEY is not set.
 */
export async function classifyDocument(
  text: string,
  fileName: string,
): Promise<ClassificationResult> {
  const claude = getClient();

  if (!claude) {
    log.warn("CLAUDE_API_KEY not set, returning deterministic classification");
    const guessedType = guessTypeFromFilename(fileName);
    return {
      document_type: guessedType,
      confidence: 0.5,
      reasons: [`Filename-based guess: ${fileName}`, "No LLM available"],
    };
  }

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Classify this document. Based on the file name and text content, determine the document type.

Known types: passport, birth_certificate, english_test_result, reference_letter, payslips, employment_contract, degree_certificate, transcripts, sponsor_approval_letter, other

File name: ${fileName}

Document text (first 3000 chars):
${text.slice(0, 3000)}

Respond with ONLY a JSON object, no markdown, no backticks:
{"document_type": "<type>", "confidence": <0.0-1.0>, "reasons": ["<reason1>", "<reason2>"]}`,
      },
    ],
  });

  const raw = (response.content[0] as { type: string; text: string }).text.trim();
  log.info({ raw, fileName }, "Classification response");

  try {
    const parsed = JSON.parse(raw);
    return classificationSchema.parse(parsed);
  } catch {
    log.warn({ raw }, "Failed to parse classification, defaulting to other");
    return { document_type: "other", confidence: 0, reasons: ["Parse failure"] };
  }
}

function guessTypeFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("passport")) return "passport";
  if (lower.includes("payslip") || lower.includes("pay_slip")) return "payslips";
  if (lower.includes("birth")) return "birth_certificate";
  if (lower.includes("degree") || lower.includes("diploma")) return "degree_certificate";
  if (lower.includes("transcript")) return "transcripts";
  if (lower.includes("ielts") || lower.includes("pte") || lower.includes("english"))
    return "english_test_result";
  if (lower.includes("reference")) return "reference_letter";
  if (lower.includes("contract") || lower.includes("employment"))
    return "employment_contract";
  if (lower.includes("sponsor")) return "sponsor_approval_letter";
  return "other";
}

// -- Field extraction --

export interface ExtractionResult<T = unknown> {
  fields: T | null;
  fieldConfidence: Record<string, number>;
  raw: unknown;
  errors: string[];
}

/**
 * Extracts structured fields from document text using Claude,
 * then validates the result against the provided Zod schema.
 * Returns deterministic defaults when CLAUDE_API_KEY is not set.
 */
export async function extractFields<T>(
  text: string,
  slotKey: string,
  schema: ZodSchema<T>,
): Promise<ExtractionResult<T>> {
  const claude = getClient();

  if (!claude) {
    log.warn("CLAUDE_API_KEY not set, returning empty extraction");
    return { fields: null, fieldConfidence: {}, raw: null, errors: ["No LLM available"] };
  }

  // Build a human-readable description of expected fields from the schema
  const schemaShape =
    schema instanceof z.ZodObject
      ? Object.keys((schema as z.ZodObject<any>).shape).join(", ")
      : slotKey;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract structured data from this ${slotKey} document.

Required fields: ${schemaShape}

Date fields must be in YYYY-MM-DD format.
Numeric fields must be numbers, not strings.

Return ONLY a JSON object with two keys:
1. "fields" -- the extracted values
2. "confidence" -- an object mapping each field name to a confidence score (0.0-1.0)

No markdown, no backticks. Example structure:
{"fields": {"full_name": "John Doe"}, "confidence": {"full_name": 0.95}}

If a field cannot be determined, use a reasonable placeholder but keep the correct type.

Document text:
${text.slice(0, 5000)}`,
      },
    ],
  });

  const raw = (response.content[0] as { type: string; text: string }).text.trim();
  log.info({ slotKey, rawLength: raw.length }, "Extraction response received");

  const errors: string[] = [];

  try {
    const parsed = JSON.parse(raw);
    const fieldsObj = parsed.fields ?? parsed;
    const confidence: Record<string, number> = parsed.confidence ?? {};

    const result = schema.safeParse(fieldsObj);

    if (result.success) {
      return { fields: result.data, fieldConfidence: confidence, raw: parsed, errors: [] };
    }

    for (const issue of result.error.issues) {
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }
    log.warn({ slotKey, errors }, "Extraction failed Zod validation");
    return { fields: null, fieldConfidence: confidence, raw: parsed, errors };
  } catch {
    errors.push("LLM response was not valid JSON");
    log.warn({ raw: raw.slice(0, 200) }, "Failed to parse extraction JSON");
    return { fields: null, fieldConfidence: {}, raw, errors };
  }
}
