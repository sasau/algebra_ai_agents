package edu.algebra.optional.case01creation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case01Test {
    @Test void wrapsPresentValues() {
        assertEquals(java.util.Optional.of("Ada"), Main.requiredName("Ada"));
        assertEquals(java.util.Optional.of("Ada"), Main.nullableName("Ada"));
    }
    @Test void representsAbsenceWithoutNullContainer() {
        assertNotNull(Main.emptyName()); assertTrue(Main.emptyName().isEmpty());
        assertTrue(Main.nullableName(null).isEmpty());
    }
    @Test void rejectsNullInRequiredFactory() {
        assertThrows(NullPointerException.class, () -> Main.requiredName(null));
    }
}
