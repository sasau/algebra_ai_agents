package lab;

import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Exercise 4 — make it return JSON.
 *
 * <pre>
 *     ./gradlew run -Pex=4              (or: ./gradlew ex4)
 * </pre>
 *
 * <p>Goal: turn the model from a chatbot into a component.
 *
 * <p>Prose is for humans. If your program needs to USE the answer — put it in
 * a variable, branch on it, store it — the answer has to be structured. This
 * is the step that makes every later session possible: a tool call
 * (Session 02) is just JSON the model produced and your code executed.
 *
 * <p>Every call below pins {@code temperature(0)} so extraction is repeatable.
 * The compiler warns that the method is deprecated — see {@link Ex03Knobs} for
 * why that warning is part of the lesson rather than a bug.
 */
public final class Ex04Json {

    private static final String SENTENCE = "lusql v0.0.1 ships today";
    private static final String SYSTEM =
            "You are a data extractor. Reply with ONLY valid JSON, no prose.";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) {
        // ══ Part A ══════════════════════════════════════════════════════
        // No system prompt. Watch what you get back.
        System.out.println();
        System.out.println("══ PART A — asking without structure ════════════════════");
        System.out.println();

        Message loose = Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(256L)
                        .temperature(0)
                        .addUserMessage("Extract the name and version from: '" + SENTENCE + "'")
                        .build());

        System.out.println("  raw reply:");
        System.out.println("    " + Client.textOf(loose).trim().replace("\n", "\n    "));
        System.out.println();
        System.out.println("  A human reads that fine. A JSON parser would throw on it.");
        System.out.println();

        // ══ Part B ══════════════════════════════════════════════════════
        // A system prompt sets the rules for the whole conversation.
        System.out.println("══ PART B — a system prompt that forces JSON ════════════");
        System.out.println();

        Message strict = Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(256L)
                        .temperature(0)
                        .system(SYSTEM)
                        .addUserMessage("Extract name and version as "
                                + "{\"name\": string, \"version\": string} from: '" + SENTENCE + "'")
                        .build());

        String raw = Client.textOf(strict).trim();
        System.out.println("  raw reply:");
        System.out.println("    " + raw.replace("\n", "\n    "));
        System.out.println();

        // ══ Part C ══════════════════════════════════════════════════════
        // Parse it — defensively. This helper is the real deliverable.
        System.out.println("══ PART C — parsing it safely ═══════════════════════════");
        System.out.println();

        JsonNode parsed = parseJson(raw);
        if (parsed != null) {
            System.out.println("  ✓ parsed into a real object:");
            System.out.println("      name    = " + parsed.path("name").asText("(missing)"));
            System.out.println("      version = " + parsed.path("version").asText("(missing)"));
            System.out.println();
            System.out.println("  That is now data. Your program can branch on it, store it,");
            System.out.println("  pass it to another method. The LLM just became a component.");
            System.out.println();
        } else {
            System.out.println("  ✗ parse failed. Raw text was:");
            System.out.println("    " + raw);
            System.out.println();
            System.out.println("  Tighten the system prompt and run again.");
            System.out.println();
        }

        // ══ Part D ══════════════════════════════════════════════════════
        // The honesty check. Structured output does not mean correct output.
        System.out.println("══ PART D — structured ≠ true ═══════════════════════════");
        System.out.println();

        Message invented = Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(256L)
                        .temperature(0)
                        .system(SYSTEM)
                        .addUserMessage("Reply as {\"answer\": string, \"confident\": boolean}. "
                                + "What is the release date of lusql version 7.3?")
                        .build());

        System.out.println("  asked about a version that does not exist:");
        System.out.println("    " + Client.textOf(invented).trim().replace("\n", "\n    "));
        System.out.println();
        System.out.println("  If it produced a confident date, you just caught a hallucination");
        System.out.println("  in perfectly valid JSON. Well-formed and wrong is the dangerous");
        System.out.println("  combination — the schema check passes and the fact is invented.");
        System.out.println();
        System.out.println("  This is why Session 09 adds human approval and Session 13 adds");
        System.out.println("  evals. Structure buys you parseability, never truth.");
        System.out.println();

        System.out.println("""

                TO DO — write in findings.md:

                  1. Paste Part A's reply next to Part B's. What did the system prompt change?
                  2. Did your reply need the fence-stripping in parseJson, or was it clean?
                  3. Part D: did the model invent a date? Paste exactly what it said —
                     that is the hallucination your findings.md needs to record.
                """);
    }

    /**
     * Parses model output into JSON, defensively. Returns null if it cannot.
     *
     * <p>Models love to wrap JSON in ```json fences or open with "Here you go:".
     * A naive parse throws on both. This strips the common wrappers first, so
     * you can see WHAT the model said instead of just "Unexpected character".
     *
     * <p>You will reuse this pattern every time you parse model output.
     */
    private static JsonNode parseJson(String text) {
        // 1. strip markdown code fences, if present
        String cleaned = text.trim()
                .replaceFirst("(?i)^```(?:json)?\\s*", "")
                .replaceFirst("\\s*```$", "");

        // 2. if there is still prose around it, grab the outermost {...} or [...]
        if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
            Matcher m = Pattern.compile("[{\\[].*[}\\]]", Pattern.DOTALL).matcher(cleaned);
            if (m.find()) {
                cleaned = m.group();
            }
        }

        try {
            return MAPPER.readTree(cleaned);
        } catch (Exception e) {
            System.out.println("      (parser said: " + e.getMessage() + ")");
            return null;
        }
    }
}
