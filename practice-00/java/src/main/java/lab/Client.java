package lab;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.OutputTokensDetails;
import com.anthropic.models.messages.Usage;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.Map;

/**
 * Shared setup for every exercise in this practice.
 *
 * <p>Use {@link #get()} and the model constants from here instead of constructing
 * a client in each file — when a model is renamed, this is the only file that
 * changes. This is the Java twin of {@code ts/src/client.ts}; the two tracks are
 * deliberately the same program written twice.
 */
public final class Client {

    private Client() {}

    /**
     * The model we use for most of this lab.
     *
     * <p>Haiku 4.5 is the cheapest current model ($1/$5 per million tokens) and it
     * is fast, which matters when twenty students hit the API at once. It is also
     * the only current model that still accepts {@code temperature} — see the note
     * on {@link #BIG_MODEL}.
     */
    public static final String MODEL = "claude-haiku-4-5";

    /**
     * A frontier model, for the one exercise where we compare answer quality.
     * Costs ~2x Haiku on input. Do not use it in a loop.
     *
     * <p>Why the lab pins Haiku rather than this:
     *
     * <p>The {@code temperature}, {@code top_p} and {@code top_k} sampling
     * parameters were REMOVED from the current frontier models. Sending a
     * non-default temperature to claude-sonnet-5, claude-opus-5 or
     * claude-opus-4-8 returns HTTP 400. Those models steer through prompting
     * instead.
     *
     * <p>Exercise 3 is about feeling what temperature does, so it needs a model
     * that still has the knob. Haiku 4.5 does.
     *
     * <p>The lesson to take away is NOT "always use Haiku" — it is that a
     * parameter you depend on can disappear in a model generation, so the model
     * id and its quirks belong in one place, not scattered across twenty call
     * sites. That is exactly why this file exists.
     */
    public static final String BIG_MODEL = "claude-sonnet-5";

    /**
     * The most capable model we touch — used once, in Exercise 7, to see what
     * the top of the range buys on the same prompt. Five times Haiku's price per
     * token, and it thinks by default, so it also spends MORE tokens per answer.
     */
    public static final String OPUS_MODEL = "claude-opus-5";

    /**
     * Price per million tokens, in dollars, as {input, output}, for every model
     * this lab calls. Lives here for the same reason the ids do: one place to
     * change it.
     *
     * <p>Thinking tokens are billed as OUTPUT tokens — they are already inside
     * {@code usage.outputTokens()}, which is why "try harder" is never free.
     */
    public static final Map<String, double[]> PRICING = Map.of(
            MODEL, new double[] {1, 5},
            BIG_MODEL, new double[] {2, 10},
            OPUS_MODEL, new double[] {5, 25});

    /** Built once, on first use. The SDK client is thread-safe and reusable. */
    private static AnthropicClient instance;

    /**
     * Returns the shared client, loading the key first.
     *
     * <p>Exits with a readable message if the key is missing — without this you
     * get a confusing 401 from deep inside the SDK instead of a sentence telling
     * you what to do about it.
     */
    public static synchronized AnthropicClient get() {
        if (instance == null) {
            loadKey();
            // Reads ANTHROPIC_API_KEY from the environment automatically.
            instance = AnthropicOkHttpClient.fromEnv();
        }
        return instance;
    }

    /**
     * Copies ANTHROPIC_API_KEY out of practice-00/.env into the JVM's system
     * properties, where the SDK's fromEnv() can see it.
     *
     * <p>There is ONE key file for the whole practice, shared with the
     * TypeScript track. Gradle runs with the cwd set to practice-00/java, so
     * .env is one directory up. A key already exported in your shell wins:
     * we only fall back to .env when the environment has nothing.
     */
    public static void loadKey() {
        if (System.getenv("ANTHROPIC_API_KEY") != null
                || System.getProperty("ANTHROPIC_API_KEY") != null) {
            return;
        }
        Dotenv dotenv = Dotenv.configure()
                .directory("..")       // practice-00/
                .ignoreIfMissing()     // let the check script report it, not a stack trace
                .load();
        String key = dotenv.get("ANTHROPIC_API_KEY");
        if (key != null && !key.isBlank()) {
            System.setProperty("ANTHROPIC_API_KEY", key);
        }
    }

    /** The key the SDK will actually use, or null if there is none. */
    public static String resolvedKey() {
        loadKey();
        String fromEnv = System.getenv("ANTHROPIC_API_KEY");
        return fromEnv != null ? fromEnv : System.getProperty("ANTHROPIC_API_KEY");
    }

    /**
     * Pulls the plain text out of a response.
     *
     * <p>A response's content is a list of blocks, and not every block is text
     * (tool calls and thinking blocks also live there). Reaching for
     * {@code content().get(0)} blindly works today and breaks the first time you
     * add a tool — so we filter by type instead. You will reuse this all term.
     */
    public static String textOf(Message message) {
        StringBuilder out = new StringBuilder();
        message.content().stream()
                .flatMap(block -> block.text().stream())
                .forEach(textBlock -> out.append(textBlock.text()));
        return out.toString();
    }

    /** Prints usage as a single readable line. */
    public static void reportUsage(String label, Usage usage) {
        System.out.printf(
                "   [%s] in: %d tok · out: %d tok%n",
                label, usage.inputTokens(), usage.outputTokens());
    }

    /** The stop reason as a plain string, or "none" when the API omitted it. */
    public static String stopReasonOf(Message message) {
        return message.stopReason().map(Object::toString).orElse("none");
    }

    /**
     * The thinking text of a response — the "working" the model did before it
     * answered, or "" if it did not think (or the API was told to omit it).
     * Same filter-by-type idea as {@link #textOf}, aimed at the other block kind.
     */
    public static String thinkingOf(Message message) {
        StringBuilder out = new StringBuilder();
        message.content().stream()
                .flatMap(block -> block.thinking().stream())
                .forEach(thinkingBlock -> out.append(thinkingBlock.thinking()));
        return out.toString();
    }

    /** How many of the billed output tokens were spent thinking (0 if none). */
    public static long thinkingTokensOf(Usage usage) {
        return usage.outputTokensDetails().map(OutputTokensDetails::thinkingTokens).orElse(0L);
    }

    /** What one call cost, in dollars, from its usage and the PRICING table. */
    public static double costOf(String model, Usage usage) {
        double[] price = PRICING.get(model);
        if (price == null) {
            return 0;
        }
        return (usage.inputTokens() * price[0] + usage.outputTokens() * price[1]) / 1_000_000;
    }
}
