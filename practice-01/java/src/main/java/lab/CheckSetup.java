package lab;

import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Run this FIRST.
 *
 * <pre>
 *     ./gradlew checkSetup          (or: ./gradlew run -Pex=check)
 * </pre>
 *
 * <p>Verifies, in order, that: the JDK is new enough, the SDK is on the
 * classpath, a key is present and well-formed, the target project has its
 * dependencies, the tools the loop shells out to (node, npm, git) exist, Docker
 * is there for Act 3, and the API actually answers you. Each check either
 * passes or tells you exactly what to do about it.
 *
 * <p>If this prints "ALL CHECKS PASSED", {@code ./gradlew agent} will run.
 */
public final class CheckSetup {

    private static int failures = 0;

    private static void pass(String label, String detail) {
        System.out.println("  ✓ " + label + (detail.isEmpty() ? "" : " — " + detail));
    }

    private static void fail(String label, String fix) {
        failures++;
        System.out.println("  ✗ " + label);
        System.out.println("      fix: " + fix);
    }

    /** A warning does not count as a failure: Acts 1–2 work without it. */
    private static void warn(String label, String note) {
        System.out.println("  ! " + label);
        System.out.println("      note: " + note);
    }

    public static void main(String[] args) {
        System.out.println();
        System.out.println("Practice 01 — environment check · Java track");
        System.out.println();

        // --- 1. JDK version ----------------------------------------------
        // The course targets Java 21. The build's toolchain enforces it too,
        // but saying so plainly beats a Gradle stack trace.
        int major = Runtime.version().feature();
        if (major >= 21) {
            pass("Java version", Runtime.version().toString());
        } else {
            fail("Java " + major + " is too old",
                    "install JDK 21 (Temurin): https://adoptium.net");
        }

        // --- 2. Dependencies on the classpath -----------------------------
        try {
            Class.forName("com.anthropic.client.okhttp.AnthropicOkHttpClient");
            pass("Anthropic SDK on the classpath", "");
        } catch (ClassNotFoundException e) {
            fail("Anthropic SDK not found",
                    "run from the java/ folder so Gradle resolves dependencies");
        }

        // --- 3. The key is present and plausible --------------------------
        // We check the shape, not the value — a typo'd key looks fine until the
        // API rejects it. We never print the key itself.
        Path practiceRoot = Path.of("..").toAbsolutePath().normalize();
        Path envFile = practiceRoot.resolve(".env");
        String key = Client.resolvedKey();

        if (key == null || key.isBlank()) {
            fail("ANTHROPIC_API_KEY is not set",
                    "cd .. && cp .env.example .env, then put your key in " + envFile);
        } else if (key.equals("sk-ant-REPLACE-ME")) {
            fail("ANTHROPIC_API_KEY is still the placeholder",
                    "open " + envFile + " and replace sk-ant-REPLACE-ME with your real key");
        } else if (!key.startsWith("sk-ant-")) {
            fail("ANTHROPIC_API_KEY does not look like an Anthropic key",
                    "keys start with 'sk-ant-' — check you copied the whole thing");
        } else {
            // Show only the last 4 characters, so you can tell two keys apart
            // without ever leaking one into a screen recording.
            pass("ANTHROPIC_API_KEY present",
                    key.length() + " chars, ends …" + key.substring(key.length() - 4));
        }

        // --- 4. .env is ignored by git ------------------------------------
        // The single most expensive mistake in this repo is committing a key.
        boolean ignored = Files.exists(practiceRoot.resolve(".gitignore"))
                || Files.exists(practiceRoot.getParent().resolve(".gitignore"));
        if (ignored) {
            pass(".gitignore present", "your .env will not be committed");
        } else {
            fail("no .gitignore found",
                    "do not commit anything until one exists — your key would go with it");
        }

        // --- 5. The target project is installed ---------------------------
        // The loop's run_tests tool spawns `npm test` in ../parser-ts. Without
        // node_modules/ the first tool call fails and the model spends its
        // budget guessing why. Catch it here instead.
        Path target = Tools.forLab().target();
        if (Files.isDirectory(target.resolve("node_modules"))) {
            pass("parser-ts dependencies installed", target.resolve("node_modules").toString());
        } else if (!Files.isDirectory(target)) {
            fail("target project not found at " + target,
                    "run from practice-01/java so ../parser-ts resolves to the parser project");
        } else {
            fail("parser-ts has no node_modules/",
                    "cd ../parser-ts && npm install");
        }

        // --- 6. node + npm on the PATH -------------------------------------
        // Java spawns them as child processes; ProcessBuilder only finds what
        // the PATH it inherited can see.
        String node = version("node", "--version");
        if (node != null) {
            pass("node on PATH", node);
        } else {
            fail("node not found on PATH",
                    "install Node 22 LTS: https://nodejs.org — then reopen your terminal");
        }
        String npm = version(Tools.npmCommand(), "--version");
        if (npm != null) {
            pass("npm on PATH", "v" + npm);
        } else {
            fail("npm not found on PATH",
                    "npm ships with Node; reinstall Node 22 LTS and reopen your terminal");
        }

        // --- 7. git on the PATH -------------------------------------------
        // The loop resets parser-ts with `git checkout` before every run and
        // shows what changed with `git diff --stat` after. No git, no Rule 5.
        String git = version("git", "--version");
        if (git != null) {
            pass("git on PATH", git);
        } else {
            fail("git not found on PATH", "install git: https://git-scm.com/downloads");
        }

        // --- 8. Docker (Act 3 only) ---------------------------------------
        // A warning, not a failure: Acts 1 and 2 never touch Docker, so a
        // missing daemon must not block the loop you are about to run.
        String docker = version("docker", "--version");
        if (docker != null) {
            pass("Docker available", docker);
        } else {
            warn("Docker not found",
                    "Act 3 needs it (Acts 1–2 do not). Install Docker Desktop: "
                    + "https://docs.docker.com/get-docker/");
        }

        // --- 9. A real round-trip to the API ------------------------------
        // Everything above is local. This is the only check that proves the key
        // works, the network is reachable, and your account has credit. We ask
        // for 5 tokens so it costs essentially nothing.
        if (failures == 0) {
            System.out.println();
            System.out.println("  … calling the API (this costs a fraction of a cent) …");
            System.out.println();
            try {
                MessageCreateParams params = MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(5L)
                        .addUserMessage("Reply with exactly: OK")
                        .build();
                Message res = Client.get().messages().create(params);
                pass("API round-trip", "model replied \"" + Client.textOf(res).trim() + "\"");
                pass("token accounting",
                        "in: " + res.usage().inputTokens() + ", out: " + res.usage().outputTokens());
            } catch (AnthropicServiceException e) {
                int status = e.statusCode();
                String msg = String.valueOf(e.getMessage());
                if (status == 401) {
                    fail("API rejected the key (401)",
                            "check the key in .env is correct and active");
                } else if (status == 429) {
                    fail("rate limited (429)", "wait a moment and run the check again");
                } else if (status == 400 && msg.toLowerCase().matches(".*(credit|balance).*")) {
                    fail("account has no credit",
                            "add credit at console.anthropic.com/settings/billing");
                } else {
                    fail("API call failed (" + status + ")", msg);
                }
            } catch (RuntimeException e) {
                fail("API call failed", String.valueOf(e.getMessage()));
            }
        } else {
            System.out.println();
            System.out.println("  … skipping the API call until the checks above pass.");
        }

        // --- verdict -------------------------------------------------------
        System.out.println();
        if (failures == 0) {
            System.out.println("  ALL CHECKS PASSED — you are ready. Start with: ./gradlew agent");
            System.out.println();
        } else {
            System.out.println("  " + failures + " check(s) failed. Fix them above, then run the check again.");
            System.out.println();
            System.exit(1);
        }
    }

    /**
     * The first line a command prints for {@code --version}, or null if it
     * cannot be started — which is what "not on PATH" looks like from Java.
     */
    private static String version(String command, String flag) {
        try {
            Tools.Exec run = Tools.exec(Path.of("."), command, flag);
            if (run.exit() != 0) {
                return null;
            }
            return run.output().lines().findFirst().orElse("").strip();
        } catch (IOException e) {
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
    }
}
