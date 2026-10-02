package lab;

import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUseBlock;
import com.fasterxml.jackson.core.type.TypeReference;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Exercise 1 — the agent loop, written by hand.
 *
 * <pre>
 *     ./gradlew agent                  (or: ./gradlew run -Pex=agent)
 *     ./gradlew agent -PmaxSteps=3     watch the budget fire before the test is green
 * </pre>
 *
 * <p>Goal: make a failing test in {@code ../parser-ts} pass, with the model
 * choosing every step. This is the lecture's loop with nothing hidden: about
 * forty lines that call the model, run what it asks for, and feed the result
 * back — until the model says it is done or the budget runs out.
 *
 * <p>The five parts of an agent, and where each one lives in this file:
 *
 * <ul>
 *   <li><b>goal</b> — {@link #GOAL}, the first user message.</li>
 *   <li><b>model</b> — {@link Client#MODEL}, called once per step.</li>
 *   <li><b>tools</b> — {@link Tools}: read_file · write_file · run_tests.</li>
 *   <li><b>memory</b> — {@code messages}, the list every call sees in full.</li>
 *   <li><b>stopping condition</b> — two halves: the SUCCESS half is the model
 *       answering with {@code stop_reason: end_turn}; the BUDGET half is
 *       {@link Client#MAX_STEPS}. You need both — a goal with no budget is a
 *       loop that never ends when the model is wrong.</li>
 * </ul>
 *
 * <p>Every turn is printed with the lecture's labels, so the transcript you get
 * IS a labelled trace: {@code [P]} perceive (the goal), {@code [D]} decide (the
 * model's text), {@code [A]} act (every tool call, including reads), {@code [O]}
 * observe (what came back). Paste 8–15 lines of it into
 * {@code agent-anatomy.md}, part 2.
 */
public final class Ex01AgentLoop {

    /**
     * GOAL. The same words every agent in this practice gets — the skill, this
     * loop, the Docker bot. It is a testable goal: {@code npm test} either exits 0
     * or it does not, so the model cannot talk its way to "done".
     */
    static final String GOAL = "Make `npm test` pass in the parser project. "
            + "Do not edit anything under `test/`. Stop when it is green.";

    /**
     * The system prompt: who the model is and how it should end. Two sentences
     * are enough; the tool descriptions in {@link Tools#definitions()} carry the
     * rest of the instructions, next to the tools they describe.
     */
    static final String SYSTEM = "You are a coding agent working in a small TypeScript project; "
            + "use the tools to read files, edit source and run the tests. "
            + "When the tests are green, reply with one line saying so and stop.";

    public static void main(String[] args) {
        // BUDGET half of the stopping condition. Client.MAX_STEPS is the default;
        // `--max-steps N` (from ./gradlew agent -PmaxSteps=N) overrides it so you
        // can watch this half fire before the success half does.
        int maxSteps = Client.MAX_STEPS;
        for (int i = 0; i < args.length - 1; i++) {
            if (args[i].equals("--max-steps")) {
                maxSteps = Integer.parseInt(args[i + 1]);
            }
        }

        // Fail here, in one sentence, rather than twelve lines of SDK stack
        // trace ending in "401" on the first call. CheckSetup explains the fix
        // in full; this just points at it.
        String key = Client.resolvedKey();
        if (key == null || key.isBlank()) {
            System.out.println();
            System.out.println("  ✗ ANTHROPIC_API_KEY is not set — the loop cannot call the model.");
            System.out.println("      fix: run ./gradlew checkSetup and follow its instructions");
            System.out.println();
            System.exit(1);
        }

        Tools tools = Tools.forLab();                      // TOOLS, jailed to ../parser-ts
        Path practiceRoot = Path.of("..").toAbsolutePath().normalize();   // practice-01/

        // Reset the target so every run starts from the same red test. Without
        // this, a second run finds the test already green and "succeeds" in one
        // step having done nothing. Warn and carry on if git cannot do it
        // (e.g. parser-ts is not tracked yet) — the loop still works, it just
        // may not be starting from the shipped bug.
        try {
            Tools.Exec reset = Tools.exec(practiceRoot, "git", "checkout", "--", "parser-ts/src");
            if (reset.exit() != 0) {
                System.out.println("! could not reset parser-ts/src (git exit " + reset.exit()
                        + "): " + reset.output().strip());
                System.out.println("  continuing — the test may already be green");
            }
        } catch (IOException | InterruptedException e) {
            System.out.println("! could not reset parser-ts/src: " + e.getMessage() + " — continuing");
        }

        System.out.printf("%nAgent loop · %s · budget %d steps · target %s%n%n",
                Client.MODEL, maxSteps, tools.target());

        Run run = new Run(tools, maxSteps);
        try {
            run.loop();
        } catch (IllegalStateException e) {
            // Printed AFTER the verification below has run (finally), so you
            // see what state the target was left in even when the loop failed.
            run.failure = e;
        } finally {
            run.verifyFromOutside(practiceRoot);
        }
        if (run.failure != null) {
            System.out.println();
            System.out.println("  ✗ " + run.failure.getMessage());
            System.out.println();
            System.exit(1);
        }
    }

    /** One run of the loop: its memory, its counters, and its verdict. */
    private static final class Run {
        private final Tools tools;
        private final int maxSteps;

        /** MEMORY: the whole conversation so far. Every call sends ALL of it. */
        private final List<MessageParam> messages = new ArrayList<>();

        private int stepsUsed = 0;
        private long inputTokens = 0;
        private long outputTokens = 0;
        private boolean goalMet = false;
        IllegalStateException failure;

        Run(Tools tools, int maxSteps) {
            this.tools = tools;
            this.maxSteps = maxSteps;
        }

        /**
         * The loop itself. Throws {@link IllegalStateException} when it cannot
         * finish: budget exhausted, output cut off, or an unexpected stop reason.
         */
        void loop() {
            // TOOLS: declared once; the same list rides along with every request.
            List<Tool> toolDefinitions = tools.definitions();

            // GOAL → the first thing the model perceives. [P] is printed once:
            // every later turn perceives the same goal plus the history below.
            System.out.println("[P] " + GOAL);
            messages.add(MessageParam.builder()
                    .role(MessageParam.Role.USER)
                    .content(GOAL)
                    .build());

            // BUDGET half of the stopping condition: the for-bound.
            for (int step = 1; step <= maxSteps; step++) {
                stepsUsed = step;
                System.out.printf("%n── step %d/%d ───────────────────────────────────────%n", step, maxSteps);

                // MODEL: one call = one decide. The request carries the system
                // prompt, the tools, and the entire memory.
                MessageCreateParams.Builder params = MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(Client.MAX_TOKENS)
                        .system(SYSTEM)
                        .messages(messages);
                toolDefinitions.forEach(params::addTool);
                Message res = Client.get().messages().create(params.build());
                inputTokens += res.usage().inputTokens();
                outputTokens += res.usage().outputTokens();

                // DECIDE: whatever the model said in words before (or instead of)
                // calling a tool. Often empty when it goes straight to a tool.
                String text = Client.textOf(res).strip();
                System.out.println("[D] " + (text.isEmpty() ? "(no text)" : text));

                StopReason.Value why = res.stopReason()
                        .map(StopReason::value)
                        .orElse(StopReason.Value._UNKNOWN);

                switch (why) {
                    case END_TURN -> {
                        // SUCCESS half of the stopping condition: the model
                        // answered without asking for a tool — it declares the
                        // goal met. We do not take its word for it; see
                        // verifyFromOutside().
                        System.out.println("[D] goal met — stopping");
                        goalMet = true;
                        return;
                    }
                    case TOOL_USE -> {
                        // ACT then OBSERVE, once per tool_use block. The model may
                        // ask for several tools in one turn (FACTS); each needs
                        // its own result, in the same order, in ONE user message.
                        List<ContentBlockParam> results = new ArrayList<>();
                        for (ContentBlock block : res.content()) {
                            if (block.toolUse().isEmpty()) {
                                continue;
                            }
                            ToolUseBlock call = block.toolUse().get();
                            Map<String, Object> input = call._input()
                                    .convert(new TypeReference<Map<String, Object>>() {});

                            // ACT: every tool call, including a read, is an action
                            // the model chose.
                            System.out.println("[A] › " + call.name() + "(" + formatArgs(input) + ")");
                            Tools.Result result = tools.dispatch(call.name(), input);

                            // OBSERVE: what came back. Only the first three lines
                            // are printed; the model gets all of it.
                            printObservation(result);

                            results.add(ContentBlockParam.ofToolResult(ToolResultBlockParam.builder()
                                    .toolUseId(call.id())     // pairs this result with its tool_use
                                    .content(result.text())
                                    .isError(result.isError())
                                    .build()));
                        }

                        // MEMORY grows by exactly two messages per step: what the
                        // model said (assistant) and what the world answered (user,
                        // tool_result blocks ONLY — any text here is a 400).
                        messages.add(res.toParam());
                        messages.add(MessageParam.builder()
                                .role(MessageParam.Role.USER)
                                .contentOfBlockParams(results)
                                .build());
                    }
                    case MAX_TOKENS -> throw new IllegalStateException(
                            "the model's reply was cut off at " + Client.MAX_TOKENS
                            + " output tokens (stop_reason: max_tokens) — raise MAX_TOKENS in Client.java");
                    default -> throw new IllegalStateException(
                            "unexpected stop_reason: " + Client.stopReasonOf(res));
                }
            }

            // Fell out of the for-loop: BUDGET half of the stopping condition fired.
            throw new IllegalStateException("budget exhausted after " + maxSteps
                    + " steps — the budget half of the stopping condition fired");
        }

        /**
         * Rule 5 — verify from OUTSIDE the loop.
         *
         * <p>The model saying "done" is a claim, not a fact. We run the test
         * ourselves, ask git what actually changed, and print the bill. This
         * runs in a {@code finally}, so you see the state of the target even
         * when the loop threw.
         */
        void verifyFromOutside(Path practiceRoot) {
            System.out.println();
            System.out.println("─ verify (from outside the loop) ─────────────────────");

            Tools.Result tests = tools.runTests();
            String verdict = tests.text().startsWith("exit code 0") ? "GREEN" : "RED";
            System.out.println("   npm test: " + verdict + " (" + tests.text().lines().findFirst().orElse("?") + ")");
            if (goalMet && verdict.equals("RED")) {
                System.out.println("   ! the model declared the goal met, but the test is still red");
            }

            try {
                Tools.Exec diff = Tools.exec(practiceRoot, "git", "diff", "--stat", "parser-ts");
                String stat = diff.output().strip();
                System.out.println("   git diff --stat parser-ts:");
                System.out.println(stat.isEmpty()
                        ? "      (no changes)"
                        : stat.lines().map(l -> "      " + l).collect(Collectors.joining("\n")));
            } catch (IOException | InterruptedException e) {
                System.out.println("   git diff failed: " + e.getMessage());
            }

            System.out.println();
            System.out.printf("   steps used: %d of %d%n", stepsUsed, maxSteps);
            System.out.printf("   tokens:     in %d · out %d%n", inputTokens, outputTokens);
            System.out.printf("   cost:       $%.4f (%s)%n",
                    Client.costOf(Client.MODEL, inputTokens, outputTokens), Client.MODEL);
            System.out.println("──────────────────────────────────────────────────────");
        }

        /** [O] — the first three lines of a result, and how much more there was. */
        private static void printObservation(Tools.Result result) {
            List<String> lines = result.text().lines().toList();
            String prefix = result.isError() ? "[O] ✗ " : "[O] ";
            if (lines.isEmpty()) {
                System.out.println(prefix + "(empty)");
                return;
            }
            System.out.println(prefix + lines.get(0));
            for (int i = 1; i < Math.min(3, lines.size()); i++) {
                System.out.println("    " + lines.get(i));
            }
            if (lines.size() > 3) {
                System.out.println("    … (+" + (lines.size() - 3) + " more lines)");
            }
        }

        /**
         * Tool arguments on one line. A whole file does not belong in a trace,
         * so long values are shown as their size.
         */
        private static String formatArgs(Map<String, Object> input) {
            return input.entrySet().stream()
                    .map(e -> {
                        String value = String.valueOf(e.getValue());
                        String shown = value.length() > 60
                                ? "<" + value.length() + " chars>"
                                : "\"" + value.replace("\n", "\\n") + "\"";
                        return e.getKey() + "=" + shown;
                    })
                    .collect(Collectors.joining(", "));
        }
    }
}
