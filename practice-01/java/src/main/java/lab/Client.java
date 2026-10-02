package lab;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.Usage;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.Map;

/**
 * Shared setup for the agent loop.
 *
 * <p>Use {@link #get()} and the constants from here instead of hard-coding them
 * in the loop — when a model is renamed or a price changes, this is the only
 * file that changes. This is the Java twin of {@code ts/src/client.ts}; the two
 * tracks are deliberately the same program written twice.
 *
 * <p>Everything a student might want to tune lives here: the model, its price,
 * the step budget, and the output-token ceiling. Nothing else in {@code lab/}
 * carries a model id or a number that belongs to the model.
 */
public final class Client {

    private Client() {}

    /**
     * The model that drives the loop.
     *
     * <p>Haiku 4.5 is the cheapest current model ($1/$5 per million tokens) and
     * it is fast — an agent loop makes 5–12 calls per run, and twenty students
     * run it at once, so speed and price both matter more here than raw
     * capability. A four-line parser fix is well within its reach.
     *
     * <p>Why not a bigger model: {@code claude-sonnet-5} (the mid-tier that
     * Practice 00 called {@code BIG_MODEL}) is now LEGACY; the current mid-tier
     * is {@code claude-sonnet-5-5} at $2/$10. Either would fix this parser too,
     * at two-plus times the cost per token and no faster — not what you want
     * inside a classroom loop. If you do swap it in, change THIS constant and
     * add its price to {@link #PRICING}; nothing else needs to know.
     */
    public static final String MODEL = "claude-haiku-4-5";

    /**
     * Price per million tokens, in dollars, as {input, output}. Lives here for
     * the same reason the id does: one place to change it. The loop prints the
     * cost of every run from this table, so you see what a fix costs.
     */
    public static final Map<String, double[]> PRICING = Map.of(
            MODEL, new double[] {1, 5});

    /**
     * The budget half of the stopping condition: how many model calls the loop
     * may make before it gives up. A step is one call — one perceive → decide →
     * act → observe cycle. Twelve is generous for a ≤ 8-line fix (a typical run
     * takes 4–7). {@code ./gradlew agent -PmaxSteps=3} overrides it for one run,
     * so you can watch the budget fire before the test is green.
     */
    public static final int MAX_STEPS = 12;

    /**
     * The most output tokens one call may produce. A {@code write_file} call
     * carries the whole new file in its arguments, so this has to fit a parser
     * source file (~60 lines) with room to spare. If a run stops with
     * {@code stop_reason: max_tokens}, the loop tells you to raise this.
     */
    public static final long MAX_TOKENS = 2048L;

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
     * Copies ANTHROPIC_API_KEY out of practice-01/.env into the JVM's system
     * properties, where the SDK's fromEnv() can see it.
     *
     * <p>There is ONE key file for the whole practice, shared with the
     * TypeScript track. Gradle runs with the cwd set to practice-01/java, so
     * .env is one directory up. A key already exported in your shell wins:
     * we only fall back to .env when the environment has nothing.
     */
    public static void loadKey() {
        if (System.getenv("ANTHROPIC_API_KEY") != null
                || System.getProperty("ANTHROPIC_API_KEY") != null) {
            return;
        }
        Dotenv dotenv = Dotenv.configure()
                .directory("..")       // practice-01/
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
     * <p>A response's content is a list of blocks, and not every block is text —
     * in this lab most responses also carry {@code tool_use} blocks. Reaching
     * for {@code content().get(0)} blindly breaks the first time the model
     * decides to call a tool, so we filter by type instead.
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

    /** What one call cost, in dollars, from its usage and the PRICING table. */
    public static double costOf(String model, Usage usage) {
        return costOf(model, usage.inputTokens(), usage.outputTokens());
    }

    /**
     * What a whole run cost, in dollars, from summed token counts. The loop
     * adds up every call's usage and asks this once at the end.
     */
    public static double costOf(String model, long inputTokens, long outputTokens) {
        double[] price = PRICING.get(model);
        if (price == null) {
            return 0;
        }
        return (inputTokens * price[0] + outputTokens * price[1]) / 1_000_000;
    }
}
