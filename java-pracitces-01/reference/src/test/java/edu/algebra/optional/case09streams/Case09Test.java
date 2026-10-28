package edu.algebra.optional.case09streams;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case09Test {
    @Test void retainsPresentNamesInOrder() {
        assertEquals(java.util.List.of("Ada", "Lin"), Main.presentNames(java.util.List.of(
                java.util.Optional.of(" Ada "), java.util.Optional.empty(), java.util.Optional.of("Lin"))));
    }
    @Test void discardsEmptyAndBlankResults() {
        assertTrue(Main.presentNames(java.util.List.of(java.util.Optional.empty(), java.util.Optional.of("  "))).isEmpty());
    }
    @Test void returnsAnUnmodifiableResult() {
        var result = Main.presentNames(java.util.List.of(java.util.Optional.of("Ada")));
        assertThrows(UnsupportedOperationException.class, () -> result.add("Lin"));
    }
}
