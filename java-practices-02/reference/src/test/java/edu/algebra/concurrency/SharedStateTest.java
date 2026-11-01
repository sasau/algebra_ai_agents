package edu.algebra.concurrency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import static edu.algebra.concurrency.LessonConsole.*;

@ExtendWith(LessonConsole.class)
@Timeout(15)
class SharedStateTest {
    @Test @DisplayName("Lost update: a barrier forces two reads of zero before either write")
    void barrierMakesLostUpdateReproducible() throws Exception {
        say("CONCEPT", "Visibility is not atomicity: volatile count++ still reads, calculates and writes separately.");
        say("SETUP", "Start at zero. Two workers each read the counter, then rendezvous at the same CyclicBarrier.");
        say("PREDICT", "Both snapshots are zero, so both write one. The write order does not change the final value.");
        int observed = Races.forcedLostUpdate();
        equal("forced unsafe counter", 1, observed,
                "This passing test establishes the deliberately demonstrated defect: two attempted increments lost one update.");
        say("LIMIT", "The barrier forces this schedule. An uncoordinated loop that happens to return two would not prove safety.");
    }

    @Test @DisplayName("Monitor: the same synchronized boundary protects all 20,000 increments")
    void monitorProtectsAllIncrements() throws Exception {
        say("CONCEPT", "Mutual exclusion protects the complete read-modify-write operation.");
        say("SETUP", "Two workers perform 10,000 increments each through one synchronized monitor method.");
        int observed = Races.safeIncrements(false, 10_000);
        equal("monitor-protected counter", 20_000, observed,
                "Every increment uses the same monitor; Future.get observes completion before the final read.");
        say("INTERPRET", "The monitor supplies exclusive access and visibility. Protecting only the final assignment would be insufficient.");
    }

    @Test @DisplayName("AtomicInteger: one atomic update preserves all 20,000 increments")
    void atomicOperationProtectsAllIncrements() throws Exception {
        say("CONCEPT", "AtomicInteger.incrementAndGet is one atomic counter update.");
        say("SETUP", "Keep the same two workers and 10,000 increments per worker; change only the protected operation.");
        int observed = Races.safeIncrements(true, 10_000);
        equal("atomic counter", 20_000, observed,
                "Each atomic update includes the read and replacement, so competing increments cannot overwrite a shared old value.");
        say("LIMIT", "An atomic counter does not make a larger multi-field business transaction atomic.");
    }
}
