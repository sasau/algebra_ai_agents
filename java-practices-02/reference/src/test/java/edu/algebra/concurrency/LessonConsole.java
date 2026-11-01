package edu.algebra.concurrency;

import java.util.Locale;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;

/**
 * Prints the teaching explanation around real JUnit assertions.
 * Text is evidence commentary; only JUnit determines whether a build passes.
 * The watcher reports the final outcome, including assertion errors and timeouts.
 */
final class LessonConsole implements BeforeEachCallback, TestWatcher {
    @Override public void beforeEach(ExtensionContext context) {
        System.out.println("\n================================================================");
        say("TEST", context.getDisplayName());
        say("ENV", "Java " + System.getProperty("java.version")
                + "; test caller=" + Thread.currentThread().getName());
    }

    static void say(String stage, String explanation) {
        System.out.printf("[%s] %s%n", stage, explanation);
    }

    static void equal(String label, Object expected, Object observed, String reason) {
        say("ASSERT", label + ": expected=" + expected + "; observed=" + observed);
        say("WHY", reason);
        Assertions.assertEquals(expected, observed, label + ": " + reason);
    }

    static void holds(String label, boolean observed, String reason) {
        say("ASSERT", label + ": expected=true; observed=" + observed);
        say("WHY", reason);
        Assertions.assertTrue(observed, label + ": " + reason);
    }

    static void report(Workloads.Kind kind, Workloads.Report report) {
        say("OBSERVED", String.format(Locale.ROOT,
                "%s / %s: completed=%d; checksum=%d; virtualTasks=%d; peakActive=%d; elapsed=%.3f ms",
                kind, report.mode(), report.completed(), report.checksum(), report.virtualTasks(),
                report.peakActive(), report.elapsedNanos() / 1_000_000.0));
    }

    @Override public void testSuccessful(ExtensionContext context) {
        say("PASS", context.getDisplayName() + " — all assertions completed successfully.");
    }

    @Override public void testFailed(ExtensionContext context, Throwable cause) {
        say("FAIL", context.getDisplayName() + " — " + cause);
        say("NEXT", "Inspect the assertion/stack trace; repair the defect and rerun this test.");
    }

    @Override public void testAborted(ExtensionContext context, Throwable cause) {
        say("NOT VERIFIED", context.getDisplayName() + " was aborted: " + cause);
    }

    @Override public void testDisabled(ExtensionContext context, java.util.Optional<String> reason) {
        say("NOT RUN", context.getDisplayName() + ": " + reason.orElse("disabled"));
    }
}
