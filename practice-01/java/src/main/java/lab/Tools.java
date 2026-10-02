package lab;

import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.Tool;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * The three tools the agent may call — and the jail they run in.
 *
 * <p>A tool is a plain function the HARNESS runs on the model's behalf. The
 * model never touches the disk or the shell itself: it emits a {@code tool_use}
 * block saying "call {@code write_file} with these arguments", and this class
 * decides whether that call is allowed, performs it, and hands the outcome back
 * as text. Everything the model can do to the world passes through here, so
 * this is where the rules live:
 *
 * <ul>
 *   <li><b>Jail.</b> Every path is resolved against the target project and must
 *       stay inside it. {@code ../.env} and {@code /etc/passwd} are refused —
 *       the model gets an error string, not the file.</li>
 *   <li><b>Rule 2 — the test is the goal, not the obstacle.</b>
 *       {@code write_file} refuses anything under {@code test/}. The goal says
 *       "do not edit anything under test/", but a goal is a request; this
 *       refusal is a guarantee. Enforce in the harness what you cannot afford
 *       to leave to the prompt.</li>
 *   <li><b>Never throw.</b> A refused or failed call comes back as a string
 *       marked {@code isError}, which the loop sends to the model as a
 *       {@code tool_result}. The model then gets to try something else — a
 *       thrown exception would kill the whole run over one bad path.</li>
 * </ul>
 *
 * <p>The three tools are IDENTICAL in name, schema and behaviour to the
 * TypeScript track's {@code ts/src/tools.ts}. Same program, two languages.
 */
public final class Tools {

    /** What one tool call returned: text for the model, plus whether it was an error. */
    public record Result(String text, boolean isError) {
        static Result ok(String text) {
            return new Result(text, false);
        }

        static Result error(String text) {
            return new Result(text, true);
        }
    }

    /** What a child process returned. {@code exit} is 124 if it timed out (like coreutils). */
    record Exec(int exit, String output) {}

    /** read_file hands back at most this many bytes — a parser file is ~2 KB; 20 KB is plenty. */
    static final int READ_CAP_BYTES = 20 * 1024;

    /** How many trailing lines of the test run the model sees. The failure is at the end. */
    static final int TAIL_LINES = 40;

    /** A hung test run must not hang the lab. vitest finishes in ~2 s; two minutes is generous. */
    static final Duration PROCESS_TIMEOUT = Duration.ofMinutes(2);

    /** The directory every path is jailed to. Absolute and normalized. */
    private final Path target;

    /**
     * Tools jailed to {@code target}. The loop uses {@link #forLab()}; the unit
     * test passes a throwaway directory so the jail can be checked without
     * touching the real parser project (or the API).
     */
    public Tools(Path target) {
        this.target = target.toAbsolutePath().normalize();
    }

    /**
     * The lab's target: {@code practice-01/parser-ts}. Gradle runs with the cwd
     * set to {@code practice-01/java}, so the sibling project is {@code ../parser-ts}.
     */
    public static Tools forLab() {
        return new Tools(Path.of("..", "parser-ts"));
    }

    /** The directory this instance is jailed to. */
    public Path target() {
        return target;
    }

    // --- the tool definitions the model sees -----------------------------------

    /**
     * The tool list sent with every request.
     *
     * <p>The {@code description} strings are not comments for you — they are the
     * PROMPT the model reads to decide when to call which tool and what to put
     * in the arguments. Write them for the model: what the tool does, what the
     * arguments mean, and what it will refuse. A vague description produces
     * vague calls.
     *
     * <p>The {@code input_schema} is JSON Schema. The SDK's
     * {@code Tool.InputSchema} builder already sets {@code "type": "object"};
     * each property is a small JSON object we hand over as a {@link JsonValue}.
     */
    public List<Tool> definitions() {
        Tool readFile = Tool.builder()
                .name("read_file")
                .description(
                        "Read a UTF-8 text file from the parser project and return its contents. "
                        + "The path is relative to the project root, e.g. \"src/parser.ts\" or "
                        + "\"test/parser.test.ts\". Paths outside the project are refused. "
                        + "Files larger than 20 KB are truncated.")
                .inputSchema(Tool.InputSchema.builder()
                        .properties(Tool.InputSchema.Properties.builder()
                                .putAdditionalProperty("path", JsonValue.from(Map.of(
                                        "type", "string",
                                        "description", "Path relative to the project root")))
                                .build())
                        .addRequired("path")
                        .build())
                .build();

        Tool writeFile = Tool.builder()
                .name("write_file")
                .description(
                        "Replace the entire contents of a file in the parser project with `content` "
                        + "(creating it if needed). The path is relative to the project root. "
                        + "Writes under test/ are REFUSED — the tests define the goal and may not "
                        + "be changed. Always send the complete file, not a diff.")
                .inputSchema(Tool.InputSchema.builder()
                        .properties(Tool.InputSchema.Properties.builder()
                                .putAdditionalProperty("path", JsonValue.from(Map.of(
                                        "type", "string",
                                        "description", "Path relative to the project root; not under test/")))
                                .putAdditionalProperty("content", JsonValue.from(Map.of(
                                        "type", "string",
                                        "description", "The complete new contents of the file")))
                                .build())
                        .addRequired("path")
                        .addRequired("content")
                        .build())
                .build();

        Tool runTests = Tool.builder()
                .name("run_tests")
                .description(
                        "Run `npm test` in the parser project and return the exit code followed by "
                        + "the last 40 lines of output. Exit code 0 means every test passed. "
                        + "Takes no arguments.")
                .inputSchema(Tool.InputSchema.builder()
                        .properties(Tool.InputSchema.Properties.builder().build())
                        .build())
                .build();

        return List.of(readFile, writeFile, runTests);
    }

    // --- dispatch: from the model's tool_use block to a Result ----------------

    /**
     * Runs the tool the model named, with the arguments it supplied.
     *
     * <p>Arguments arrive as a loosely-typed map because that is what JSON
     * gives us; a missing or non-string argument is the model's mistake and is
     * reported back to it as an error, never thrown.
     */
    public Result dispatch(String name, Map<String, Object> input) {
        switch (name) {
            case "read_file":
                return readFile(string(input, "path"));
            case "write_file":
                return writeFile(string(input, "path"), string(input, "content"));
            case "run_tests":
                return runTests();
            default:
                // The model can only call tools we declared, so this means our
                // definitions() and this switch disagree — a harness bug, but
                // still reported, not thrown, so the run can continue.
                return Result.error("unknown tool: " + name
                        + " (available: read_file, write_file, run_tests)");
        }
    }

    /** The named argument as a string, or "" if absent — the tool itself reports the problem. */
    private static String string(Map<String, Object> input, String key) {
        Object value = input == null ? null : input.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    // --- the three tools --------------------------------------------------------

    /** read_file(path): the file's text, capped at {@link #READ_CAP_BYTES}. */
    public Result readFile(String path) {
        Path file;
        try {
            file = jail(path);
        } catch (Refused e) {
            return Result.error(e.getMessage());
        }
        if (!Files.exists(file)) {
            return Result.error("no such file: " + path);
        }
        if (Files.isDirectory(file)) {
            return Result.error(path + " is a directory, not a file");
        }
        try {
            byte[] bytes = Files.readAllBytes(file);
            if (bytes.length <= READ_CAP_BYTES) {
                return Result.ok(new String(bytes, StandardCharsets.UTF_8));
            }
            // Truncate rather than refuse: a huge file is still worth a look at
            // the top, and the note tells the model why it ends abruptly.
            String head = new String(Arrays.copyOf(bytes, READ_CAP_BYTES), StandardCharsets.UTF_8);
            return Result.ok(head + "\n… [truncated: " + bytes.length + " bytes, showing first "
                    + READ_CAP_BYTES + "]");
        } catch (IOException e) {
            return Result.error("could not read " + path + ": " + e.getMessage());
        }
    }

    /** write_file(path, content): replaces the file. Refuses {@code test/**} (Rule 2). */
    public Result writeFile(String path, String content) {
        Path file;
        try {
            file = jail(path);
        } catch (Refused e) {
            return Result.error(e.getMessage());
        }
        // Rule 2, enforced by the harness, not the prompt. The goal already
        // SAYS "do not edit anything under test/"; this makes it impossible.
        // We test the normalized, jailed path so `src/../test/x.ts` is caught too.
        Path relative = target.relativize(file);
        if (relative.getNameCount() > 0 && relative.getName(0).toString().equals("test")) {
            return Result.error("refused: '" + path + "' is under test/ — the tests define the goal "
                    + "and may not be edited. Fix the source under src/ instead.");
        }
        try {
            Files.createDirectories(file.getParent());
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            Files.write(file, bytes);
            return Result.ok("wrote " + bytes.length + " bytes to " + relative);
        } catch (IOException e) {
            return Result.error("could not write " + path + ": " + e.getMessage());
        }
    }

    /**
     * run_tests(): {@code npm test} in the target, as "exit code N" + the last 40 lines.
     *
     * <p>A FAILING test is not a tool error — the tool did its job, the answer
     * is just "red". {@code isError} is reserved for the tool itself breaking:
     * npm not installed, or the run hanging past the timeout.
     */
    public Result runTests() {
        try {
            Exec run = exec(target, npmCommand(), "test");
            String tail = lastLines(run.output(), TAIL_LINES);
            String text = "exit code " + run.exit() + "\n" + tail;
            if (run.exit() == 124) {
                return Result.error("npm test did not finish within " + PROCESS_TIMEOUT.toSeconds()
                        + " s and was killed\n" + tail);
            }
            return Result.ok(text);
        } catch (IOException e) {
            return Result.error("could not start `npm test` in " + target + ": " + e.getMessage()
                    + " — is Node on your PATH, and did you run `npm install` in parser-ts/?");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Result.error("interrupted while running npm test");
        }
    }

    // --- the jail -------------------------------------------------------------

    /** Thrown inside this class only; every public method turns it into an error Result. */
    private static final class Refused extends Exception {
        Refused(String message) {
            super(message);
        }
    }

    /**
     * Turns a model-supplied path into a real one, or refuses.
     *
     * <p>Three things can go wrong and each is checked explicitly: an empty
     * path, an absolute path ({@code /etc/passwd}), and a relative path that
     * climbs out ({@code ../.env}). {@code normalize()} collapses the {@code ..}
     * segments first, so the {@code startsWith} test is on the real location.
     */
    private Path jail(String path) throws Refused {
        if (path == null || path.isBlank()) {
            throw new Refused("refused: path is empty");
        }
        Path given = Path.of(path);
        if (given.isAbsolute()) {
            throw new Refused("refused: absolute path '" + path
                    + "' — paths must be relative to the parser project");
        }
        Path resolved = target.resolve(given).normalize();
        if (!resolved.startsWith(target)) {
            throw new Refused("refused: '" + path + "' escapes the parser project");
        }
        return resolved;
    }

    // --- process helpers (shared with the loop and the setup check) ------------

    /** npm is a .cmd shim on Windows; ProcessBuilder cannot find it by the bare name. */
    static String npmCommand() {
        return System.getProperty("os.name", "").toLowerCase().contains("win") ? "npm.cmd" : "npm";
    }

    /**
     * Runs a command in {@code dir}, merging stderr into stdout, with a timeout.
     *
     * <p>Merging the streams keeps the output in the order a human saw it and
     * means we cannot deadlock on a full stderr pipe. Colour is switched off so
     * the model reads words, not ANSI escape codes.
     */
    static Exec exec(Path dir, String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command)
                .directory(dir.toFile())
                .redirectErrorStream(true);
        pb.environment().put("FORCE_COLOR", "0");
        pb.environment().put("NO_COLOR", "1");
        Process process = pb.start();
        // Read everything first: a process that fills its stdout pipe blocks
        // forever if nobody drains it, and waitFor() alone would never return.
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!process.waitFor(PROCESS_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)) {
            process.destroyForcibly();
            return new Exec(124, output);
        }
        return new Exec(process.exitValue(), output);
    }

    /** The last {@code n} lines of {@code text}. */
    static String lastLines(String text, int n) {
        String[] lines = text.strip().split("\\R");
        int from = Math.max(0, lines.length - n);
        return String.join("\n", Arrays.copyOfRange(lines, from, lines.length));
    }
}
