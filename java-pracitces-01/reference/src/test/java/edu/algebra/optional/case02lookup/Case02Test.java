package edu.algebra.optional.case02lookup;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case02Test {
    @Test void findsExistingName() { assertEquals(java.util.Optional.of("Ada"), Main.findName("u1")); }
    @Test void missingNameIsEmpty() { assertTrue(Main.findName("u9").isEmpty()); }
    @Test void rejectsNullIdentifier() { assertThrows(NullPointerException.class, () -> Main.findName(null)); }
}
