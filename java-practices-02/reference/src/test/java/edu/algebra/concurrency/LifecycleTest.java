package edu.algebra.concurrency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import static edu.algebra.concurrency.LessonConsole.*;

@ExtendWith(LessonConsole.class)
@Timeout(15)
class LifecycleTest {
    @Test @DisplayName("Lifecycle: start executes on the worker; a direct run stays on the caller")
    void startRunsOnWorkerAndDirectRunStaysOnCaller() throws Exception {
        say("CONCEPT", "start creates another execution path; run is an ordinary method call.");
        say("SETUP", "Create a platform worker named lesson-worker and capture Thread.currentThread().getName().");
        say("EXECUTE", "Call startAndJoin; join waits for termination before the caller reads the result.");
        String worker = Lifecycle.startAndJoin();
        equal("executing worker name", "lesson-worker", worker,
                "The name is obtained inside the task, so it identifies the thread that actually executed it.");
        String caller = Thread.currentThread().getName();
        say("EXECUTE", "Call directRun from " + caller + "; no new thread is started.");
        equal("direct-call thread name", caller, Lifecycle.directRun(),
                "run executes on its caller. Its result must match the test caller, not the unstarted worker name.");
        say("INTERPRET", "Successful join also establishes visibility of the worker actions to this caller.");
        say("LIMIT", "This test checks ownership and completion; it makes no promise about which thread prints first.");
    }
}
