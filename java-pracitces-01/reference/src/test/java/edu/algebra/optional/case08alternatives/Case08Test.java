package edu.algebra.optional.case08alternatives;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case08Test {
    @Test void cacheHitSkipsAlternative() {
        assertEquals(java.util.Optional.of("cached"), Main.resolve(() -> java.util.Optional.of("cached"), () -> {
            fail("database must not run"); return java.util.Optional.empty();
        }));
    }
    @Test void cacheMissCallsAlternativeOnce() {
        int[] calls = {0};
        assertEquals(java.util.Optional.of("stored"), Main.resolve(java.util.Optional::empty, () -> {
            calls[0]++; return java.util.Optional.of("stored");
        }));
        assertEquals(1, calls[0]);
    }
    @Test void allSourcesMissingRemainEmpty() {
        assertTrue(Main.resolve(java.util.Optional::empty, java.util.Optional::empty).isEmpty());
    }
}
