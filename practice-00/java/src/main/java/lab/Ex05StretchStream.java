package lab;

import com.anthropic.core.http.StreamResponse;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.RawMessageStreamEvent;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Stretch 1 — watch the generate loop live.
 *
 * <pre>
 *     ./gradlew run -Pex=stream         (or: ./gradlew stretchStream)
 * </pre>
 *
 * <p>Everything so far waited for the complete answer. Streaming shows you
 * tokens as they are produced — which is what the lecture's "one token at a
 * time" loop actually looks like from outside.
 */
public final class Ex05StretchStream {

    public static void main(String[] args) {
        System.out.println();
        System.out.println("Streaming — watch the tokens arrive one at a time:");
        System.out.println();

        long started = System.currentTimeMillis();
        AtomicInteger chunks = new AtomicInteger();
        AtomicLong firstChunkMs = new AtomicLong();
        AtomicLong outputTokens = new AtomicLong();

        MessageCreateParams params = MessageCreateParams.builder()
                .model(Client.MODEL)
                .maxTokens(300L)
                .addUserMessage("Explain what a JOIN does, in about 80 words.")
                .build();

        try (StreamResponse<RawMessageStreamEvent> stream =
                     Client.get().messages().createStreaming(params)) {

            stream.stream().forEach(event -> {
                // Text arrives as content_block_delta events.
                event.contentBlockDelta()
                        .flatMap(d -> d.delta().text())
                        .ifPresent(textDelta -> {
                            if (chunks.getAndIncrement() == 0) {
                                firstChunkMs.set(System.currentTimeMillis() - started);
                            }
                            System.out.print(textDelta.text());
                            System.out.flush();
                        });
                // The final usage totals ride along on message_delta.
                event.messageDelta()
                        .ifPresent(d -> outputTokens.set(d.usage().outputTokens()));
            });
        }

        long totalMs = System.currentTimeMillis() - started;

        System.out.println();
        System.out.println();
        System.out.println("─ what you just watched ───────────────────────────────");
        System.out.println("   time to first chunk: " + firstChunkMs.get() + " ms");
        System.out.println("   total time:          " + totalMs + " ms");
        System.out.println("   chunks received:     " + chunks.get());
        System.out.println("   output tokens:       " + outputTokens.get());
        System.out.println("───────────────────────────────────────────────────────");

        System.out.printf("""

                The total time is the same either way — streaming does not make the
                model faster. What it changes is the WAIT: the user sees progress
                after %d ms instead of %d ms.

                That gap is why every chat UI streams. It is also why Session 06
                cares about budgets: a loop that runs for a minute needs to show
                its work.
                %n""", firstChunkMs.get(), totalMs);
    }
}
