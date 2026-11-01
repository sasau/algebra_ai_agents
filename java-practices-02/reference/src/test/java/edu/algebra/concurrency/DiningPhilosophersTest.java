package edu.algebra.concurrency;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import static edu.algebra.concurrency.LessonConsole.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(LessonConsole.class)
@Timeout(15)
class DiningPhilosophersTest {
    @Test @DisplayName("Circular wait: observe five held first forks, then stop every demonstration worker")
    void circularWaitIsObservedAndEveryDemoWorkerStops() throws Exception {
        say("CONCEPT", "Deadlock comes from a resource cycle, not merely from a slow or timed-out program.");
        say("SETUP", "Pi acquires Fi, then waits for F(i+1)%5. A latch ensures all five first forks are held.");
        say("RECOVERY", "The demonstration interrupts all workers before joining any; each worker releases acquired forks in finally.");
        var snapshot = DiningPhilosophers.circularWait();
        say("OBSERVED", snapshot.toString());
        equal("held first forks", 5, snapshot.heldFirstForks(),
                "The coordinated ownership snapshot establishes the cycle; no second fork can be obtained.");
        holds("all demonstration workers stopped", snapshot.workersStopped(),
                "A teaching deadlock must recover and leave no demonstration worker alive after returning.");
    }

    @Test @DisplayName("Global lock order: every philosopher completes four meals without sharing a held fork")
    void globalOrderCompletesDinnerOnPlatformAndVirtualThreads() throws Exception {
        say("CONCEPT", "Every philosopher takes min(left,right), then max(left,right), removing circular wait.");
        say("SETUP", "Run five philosophers for four meals each on both platform and virtual threads.");
        say("DETAIL", "P4 needs F4 and F0 but must acquire F0 first; all other workers use the same numeric ordering.");
        for (boolean virtual : new boolean[] { false, true }) {
            say("EXECUTE", virtual ? "Virtual-thread dinner" : "Platform-thread dinner");
            var dinner = DiningPhilosophers.ordered(4, virtual);
            for (String event : dinner.events()) say("ACTUAL EVENT", event);
            equal("meals for P0..P4", List.of(4, 4, 4, 4, 4), dinner.meals(),
                    "Each philosopher must make bounded progress in this run; a total alone could conceal a missed philosopher.");
            equal("completed eating events", 20L,
                    dinner.events().stream().filter(event -> event.contains(" EATING ")).count(),
                    "Five philosophers completing four meals must produce twenty observed eating entries.");
            say("SAFETY", "Fork ownership was checked inside every eating section; a conflict raises AssertionError through its Future.");
        }
        say("LIMIT", "Event order varies. These successful finite runs do not prove starvation freedom or scheduler fairness.");
    }

    @Test @DisplayName("Dinner input: reject zero rounds before any philosopher starts")
    void invalidDinnerSizeFailsBeforeSpawningThreads() {
        say("SETUP", "Request zero rounds; the lesson accepts 1..50 rounds.");
        say("EXPECT", "IllegalArgumentException explains the valid range before any worker is created.");
        var failure = assertThrows(IllegalArgumentException.class, () -> DiningPhilosophers.ordered(0, true));
        say("OBSERVED", failure.getClass().getSimpleName() + ": " + failure.getMessage());
    }
}
