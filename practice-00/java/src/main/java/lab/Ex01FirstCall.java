package lab;

import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

/**
 * Exercise 1 — your first Messages API call.
 *
 * <pre>
 *     ./gradlew run -Pex=1              (or: ./gradlew ex1)
 * </pre>
 *
 * <p>Goal: prompt in → text out → read the token meter.
 *
 * <p>This is the smallest real LLM call there is. Every agent you build this
 * term is ultimately a loop around this one method call.
 */
public final class Ex01FirstCall {

    private static final String QUESTION = "In one sentence, what is a primary key?";

    public static void main(String[] args) {
        System.out.printf("%nAsking (%s): \"%s\"%n%n", Client.MODEL, QUESTION);

        MessageCreateParams params = MessageCreateParams.builder()
                .model(Client.MODEL)
                .maxTokens(256L)
                .addUserMessage(QUESTION)
                .build();

        Message res = Client.get().messages().create(params);
        String reply = Client.textOf(res);

        System.out.println("─ reply ───────────────────────────────────────────────");
        System.out.println(reply);
        System.out.println("───────────────────────────────────────────────────────");
        System.out.println();

        Client.reportUsage("usage", res.usage());
        System.out.println("   stop_reason: " + Client.stopReasonOf(res));

        // --- the token meter, made concrete ------------------------------
        // The lecture's rule of thumb is that one token is about ¾ of a word.
        // Here we check that against the actual counts, because a number you
        // verified yourself is worth more than a number you were told.
        int promptWords = QUESTION.trim().split("\\s+").length;
        int replyWords = reply.trim().split("\\s+").length;

        System.out.println();
        System.out.println("─ token arithmetic ────────────────────────────────────");
        System.out.printf("   prompt: %d words → %d input tokens%n",
                promptWords, res.usage().inputTokens());
        System.out.printf("   reply:  %d words → %d output tokens%n",
                replyWords, res.usage().outputTokens());
        System.out.printf("   ratio:  %.2f tokens per word%n",
                (double) res.usage().outputTokens() / Math.max(replyWords, 1));
        System.out.println("───────────────────────────────────────────────────────");

        System.out.println("""

                TO DO — run this twice, then write in findings.md:

                  1. Did the two runs return the same text? (No temperature is set
                     here, so the default applies — note what you actually observe.)
                  2. How close was the tokens-per-word ratio to the lecture's ≈1.33
                     (i.e. 1 token ≈ ¾ word)?
                  3. input_tokens is larger than the prompt alone. Why? (Hint: the
                     model also receives structural tokens marking where your turn
                     starts and ends.)
                """);
    }
}
