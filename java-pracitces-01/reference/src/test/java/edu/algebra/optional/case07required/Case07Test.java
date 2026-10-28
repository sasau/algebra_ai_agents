package edu.algebra.optional.case07required;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case07Test {
    @Test void returnsRequiredValue() { assertEquals("Ada", Main.requireName("u1")); }
    @Test void missingValueHasDomainContext() {
        var failure = assertThrows(Main.MissingCustomerException.class, () -> Main.requireName("u9"));
        assertEquals("No customer: u9", failure.getMessage());
    }
    @Test void unsafeGetShowsTheSpecificPitfall() {
        assertThrows(java.util.NoSuchElementException.class, Main::unsafeEmptyGet);
    }
}
