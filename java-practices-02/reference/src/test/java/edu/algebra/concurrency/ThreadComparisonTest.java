package edu.algebra.concurrency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import static edu.algebra.concurrency.LessonConsole.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(LessonConsole.class)
@Timeout(15)
class ThreadComparisonTest {
    @Test @DisplayName("Blocking tasks: every strategy completes equal work on the expected thread type")
    void blockingModesCompleteIdenticalWorkAndUseExpectedThreadType() throws Exception {
        say("CONCEPT", "Execution strategy may change overlap and cost; it must not change results.");
        say("SETUP", "Task ids 1..12 each wait 1 ms and return their id; the expected sum is 78.");
        say("POLICY", "Sequential caller, three-worker platform pool, platform per task and virtual per task use the same body.");
        for (var mode : Workloads.Mode.values()) {
            say("EXECUTE", "Run " + mode + " and wait for every result and executor cleanup.");
            var r = Workloads.run(mode, Workloads.Kind.BLOCKING, 12, 1, 100, 3, 0);
            report(Workloads.Kind.BLOCKING, r);
            equal(mode + " completed tasks", 12, r.completed(), "Every submitted task must produce a result.");
            equal(mode + " checksum", 78L, r.checksum(), "The same numbered inputs require the same returned work.");
            equal(mode + " actual virtual tasks", mode == Workloads.Mode.VIRTUAL_PER_TASK ? 12 : 0,
                    r.virtualTasks(), "Thread.isVirtual is captured inside each real task, not inferred from the selected label.");
        }
        say("LIMIT", "Elapsed times are observations. This unit test requires no speedup and claims no memory measurement.");
    }

    @Test @DisplayName("CPU tasks: changing thread strategy preserves the returned computation")
    void cpuModesReturnIdenticalComputedResults() throws Exception {
        say("CONCEPT", "More runnable threads do not add CPU cores. Verify equal work before interpreting performance.");
        say("SETUP", "Use 12 ids and 1,000 arithmetic iterations each; retain the sequential checksum as the comparison baseline.");
        long expected = Workloads.run(Workloads.Mode.SEQUENTIAL, Workloads.Kind.CPU, 12, 0, 1000, 3, 0).checksum();
        say("BASELINE", "Sequential returned checksum=" + expected + "; signed long overflow is intentional.");
        for (var mode : Workloads.Mode.values()) {
            var r = Workloads.run(mode, Workloads.Kind.CPU, 12, 0, 1000, 3, 0);
            report(Workloads.Kind.CPU, r);
            equal(mode + " completed CPU tasks", 12, r.completed(), "The computation must not omit work.");
            equal(mode + " CPU checksum", expected, r.checksum(),
                    "All modes compute and return the same values; no fixed relative-time assertion is valid here.");
        }
        say("LIMIT", "These small unit workloads are for correctness. Use the separate warmup/median command for a timing experiment.");
    }

    @Test @DisplayName("Semaphore: twenty virtual tasks share at most two scarce-resource slots")
    void semaphoreBoundsVirtualWorkAtScarceResource() throws Exception {
        say("CONCEPT", "Thread count and dependency capacity are separate policies.");
        say("SETUP", "Create 20 virtual tasks but grant only two permits around active resource use.");
        var r = Workloads.run(Workloads.Mode.VIRTUAL_PER_TASK, Workloads.Kind.BLOCKING, 20, 2, 100, 3, 2);
        report(Workloads.Kind.BLOCKING, r);
        equal("completed tasks", 20, r.completed(), "Waiting for a permit must not discard tasks.");
        equal("virtual tasks", 20, r.virtualTasks(), "Resource limiting must preserve the selected thread strategy.");
        say("ASSERT", "resource peak: expected range=1..2; observed=" + r.peakActive());
        holds("resource concurrency remains within the limit", r.peakActive() >= 1 && r.peakActive() <= 2,
                "Only permit holders enter the instrumented section; finally releases their permits on every exit.");
        say("LIMIT", "This bounds concurrent entry, not requests per second or total task admission.");
    }

    @Test @DisplayName("Input limits: reject an excessive task count before starting work")
    void invalidWorkloadSizeFailsBeforeSpawningThreads() {
        say("SETUP", "Request 257 tasks; the classroom runner supports at most 256 to bound native thread use.");
        say("EXPECT", "Input validation rejects the call with IllegalArgumentException before executor creation.");
        var failure = assertThrows(IllegalArgumentException.class,
                () -> Workloads.run(Workloads.Mode.VIRTUAL_PER_TASK, Workloads.Kind.BLOCKING, 257, 1, 1, 3, 0));
        say("OBSERVED", failure.getClass().getSimpleName() + ": " + failure.getMessage());
    }
}
