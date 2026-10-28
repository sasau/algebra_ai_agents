package edu.algebra.optional.case10primitive;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case10Test {
    @Test void findsMaximum() { assertEquals(9, Main.maximum(7, 9, 5).orElseThrow()); }
    @Test void emptyInputHasNoMaximum() { assertTrue(Main.maximum().isEmpty()); }
    @Test void doesNotInventZeroForNegativeScores() { assertEquals(-2, Main.maximum(-8, -2, -5).orElseThrow()); }
}
