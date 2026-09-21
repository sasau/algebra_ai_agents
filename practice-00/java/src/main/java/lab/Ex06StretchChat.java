package lab;

import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Stretch 2 — your own 40-line chatbox.
 *
 * <pre>
 *     ./gradlew run -Pex=chat           (or: ./gradlew stretchChat)
 * </pre>
 *
 * <p>Exercise 2 in a loop: read a line, append it to the history, send the
 * whole history, append the reply. Type /tokens to see what the conversation
 * costs so far, /reset to clear it, /quit to leave.
 *
 * <p>There is no framework here. A chat app IS this loop.
 */
public final class Ex06StretchChat {

    public static void main(String[] args) throws IOException {
        List<MessageParam> messages = new ArrayList<>();
        int turns = 0;
        long lastInputTokens = 0;
        long totalOutputTokens = 0;

        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

        System.out.printf("""

                ┌─────────────────────────────────────────────────────────┐
                │  Practice 00 — study buddy                              │
                │  model: %-48s│
                │                                                         │
                │  /tokens   what this conversation costs so far          │
                │  /reset    forget everything                            │
                │  /quit     exit                                         │
                └─────────────────────────────────────────────────────────┘
                %n""", Client.MODEL);

        while (true) {
            System.out.print("you  → ");
            System.out.flush();

            String line = in.readLine();
            if (line == null) break; // stdin closed
            String input = line.trim();

            if (input.isEmpty()) continue;
            if (input.equals("/quit")) break;

            if (input.equals("/reset")) {
                messages.clear();
                turns = 0;
                lastInputTokens = 0;
                totalOutputTokens = 0;
                System.out.println("      (history cleared — it has no idea who you are again)");
                System.out.println();
                continue;
            }

            if (input.equals("/tokens")) {
                System.out.println("      turns:                 " + turns);
                System.out.println("      messages in history:   " + messages.size());
                System.out.println("      last turn's input:     " + lastInputTokens + " tokens");
                System.out.println("      output so far:         " + totalOutputTokens + " tokens");
                System.out.println("      (input is re-sent in full every single turn)");
                System.out.println();
                continue;
            }

            messages.add(MessageParam.builder()
                    .role(MessageParam.Role.USER)
                    .content(input)
                    .build());

            try {
                Message res = Client.get().messages().create(
                        MessageCreateParams.builder()
                                .model(Client.MODEL)
                                .maxTokens(512L)
                                .messages(messages)
                                .build());

                messages.add(res.toParam());
                turns++;
                lastInputTokens = res.usage().inputTokens();
                totalOutputTokens += res.usage().outputTokens();

                System.out.println("model→ " + Client.textOf(res).trim());
                System.out.printf("      [in %d · out %d]%n%n",
                        res.usage().inputTokens(), res.usage().outputTokens());
            } catch (AnthropicServiceException e) {
                System.out.printf("      ✗ API error (%d): %s%n%n", e.statusCode(), e.getMessage());
                // Drop the user turn we could not answer, so history stays valid.
                messages.remove(messages.size() - 1);
            }
        }

        System.out.printf("""

                Done. %d turns, %d output tokens.

                Notice what you did NOT write: any memory system. The messages list
                was the memory. Session 08 asks the obvious next question — what
                happens when that list no longer fits?
                %n""", turns, totalOutputTokens);
    }
}
