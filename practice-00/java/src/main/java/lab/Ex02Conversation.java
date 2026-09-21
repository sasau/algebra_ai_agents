package lab;

import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import java.util.ArrayList;
import java.util.List;

/**
 * Exercise 2 — a conversation you build by hand.
 *
 * <pre>
 *     ./gradlew run -Pex=2              (or: ./gradlew ex2)
 * </pre>
 *
 * <p>Goal: prove that the model has no memory, then build memory yourself by
 * re-sending the history — and watch what that costs.
 *
 * <p>This is the single most important idea in the whole course. "Memory" is
 * not a model feature. It is a list you maintain and re-send. Sessions 08 and
 * 11 are entirely about managing that list once it gets too big to re-send.
 */
public final class Ex02Conversation {

    /** One call with whatever history you hand it. */
    private static Message ask(List<MessageParam> messages) {
        return Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(128L)
                        .messages(messages)
                        .build());
    }

    private static MessageParam userTurn(String text) {
        return MessageParam.builder().role(MessageParam.Role.USER).content(text).build();
    }

    public static void main(String[] args) {
        // ══ Part A ══════════════════════════════════════════════════════
        // Two separate calls. The second has no idea the first ever happened.
        System.out.println();
        System.out.println("══ PART A — two separate calls (statelessness) ═══════════");
        System.out.println();

        Message a1 = ask(List.of(userTurn("My name is Ada. Remember it.")));
        System.out.println("  you  → \"My name is Ada. Remember it.\"");
        System.out.println("  model→ " + Client.textOf(a1).trim());
        System.out.println();

        Message a2 = ask(List.of(userTurn("What is my name?")));
        System.out.println("  you  → \"What is my name?\"   (a brand-new call)");
        System.out.println("  model→ " + Client.textOf(a2).trim());
        System.out.println();

        System.out.println("  ↑ It does not know. Nothing carried over. The model is a");
        System.out.println("    pure function: same input in, answer out, then it forgets.");
        System.out.println();

        // ══ Part B ══════════════════════════════════════════════════════
        // Same two questions — but now we carry the history ourselves.
        System.out.println("══ PART B — one growing messages list (memory) ══════════");
        System.out.println();

        List<MessageParam> messages = new ArrayList<>();
        messages.add(userTurn("My name is Ada. Remember it."));

        Message b1 = ask(messages);
        System.out.println("  turn 1  you  → \"My name is Ada. Remember it.\"");
        System.out.println("          model→ " + Client.textOf(b1).trim());
        System.out.println("          input_tokens: " + b1.usage().inputTokens());
        System.out.println();

        // The two lines that create "memory": push the reply, then the follow-up.
        // toParam() turns a response back into a message you can re-send.
        messages.add(b1.toParam());
        messages.add(userTurn("What is my name?"));

        Message b2 = ask(messages);
        System.out.println("  turn 2  you  → \"What is my name?\"   (with history attached)");
        System.out.println("          model→ " + Client.textOf(b2).trim());
        System.out.println("          input_tokens: " + b2.usage().inputTokens());
        System.out.println();

        // ══ Part C ══════════════════════════════════════════════════════
        // Keep going, and watch the bill grow. Every turn re-sends everything
        // before it.
        System.out.println("══ PART C — what re-sending history costs ═══════════════");
        System.out.println();

        String[] followUps = {
            "Spell my name backwards.",
            "How many letters does it have?",
            "Use it in a sentence about databases.",
        };

        List<Long> growth = new ArrayList<>(List.of(b1.usage().inputTokens(), b2.usage().inputTokens()));

        // Close off turn 2 so the list ends on an assistant turn.
        messages.add(b2.toParam());

        for (int i = 0; i < followUps.length; i++) {
            long prev = growth.get(growth.size() - 1);

            messages.add(userTurn(followUps[i]));
            Message r = ask(messages);
            messages.add(r.toParam());

            long now = r.usage().inputTokens();
            growth.add(now);
            System.out.printf("  turn %d  input_tokens: %4d  (+%d vs previous turn)%n",
                    i + 3, now, now - prev);
        }

        long first = growth.get(0);
        long last = growth.get(growth.size() - 1);
        StringBuilder curve = new StringBuilder();
        for (int i = 0; i < growth.size(); i++) {
            if (i > 0) curve.append(" → ");
            curve.append(growth.get(i));
        }

        System.out.println();
        System.out.println("─ the shape of the problem ────────────────────────────");
        System.out.printf("   turn 1 cost you %d input tokens.%n", first);
        System.out.printf("   turn %d cost you %d — a %.1f× increase.%n",
                growth.size(), last, (double) last / first);
        System.out.println("   growth curve: " + curve);
        System.out.println("───────────────────────────────────────────────────────");

        System.out.println("""

                TO DO — write in findings.md:

                  1. Paste the growth curve above. Is it linear, or worse?
                  2. You pay for input tokens on EVERY turn. A 50-turn conversation
                     re-sends turn 1 fifty times. What does that imply about cost?
                  3. The context window is finite (Haiku 4.5: 200K tokens). At this
                     growth rate, roughly how many turns until you hit the wall?

                  This is the problem Session 08 (memory) and Session 11 (context
                  management) exist to solve. You just met it first-hand — and it
                  is the same curve you watched /context draw in Act 2.
                """);
    }
}
