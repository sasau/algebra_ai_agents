package edu.algebra.optional.case03mapping;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case03Test {
    @Test void trimsBeforeMeasuring() { assertEquals(java.util.Optional.of(3), Main.trimmedLength(" Ada ")); }
    @Test void preservesMissingInput() { assertTrue(Main.trimmedLength(null).isEmpty()); }
    @Test void distinguishesZeroFromAbsence() { assertEquals(java.util.Optional.of(0), Main.trimmedLength("   ")); }
}
