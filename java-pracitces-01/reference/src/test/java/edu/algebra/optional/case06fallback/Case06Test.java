package edu.algebra.optional.case06fallback;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case06Test {
    @Test void eagerFallbackRunsForPresence() {
        int[] calls = {0};
        assertEquals("Ada", Main.eagerName(java.util.Optional.of("Ada"), () -> { calls[0]++; return "guest"; }));
        assertEquals(1, calls[0]);
    }
    @Test void lazyFallbackDoesNotRunForPresence() {
        assertEquals("Ada", Main.lazyName(java.util.Optional.of("Ada"), () -> { fail("must not run"); return "guest"; }));
    }
    @Test void lazyFallbackRunsExactlyOnceForAbsence() {
        int[] calls = {0};
        assertEquals("guest", Main.lazyName(java.util.Optional.empty(), () -> { calls[0]++; return "guest"; }));
        assertEquals(1, calls[0]);
    }
}
