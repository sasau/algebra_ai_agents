package edu.algebra.optional.case05flatmapping;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case05Test {
    @Test void flattensPresentEmail() { assertEquals(java.util.Optional.of("ada@example.org"), Main.emailFor("u1")); }
    @Test void handlesPresentUserWithMissingEmail() {
        assertTrue(Main.nestedEmailFor("u2").isPresent());
        assertTrue(Main.nestedEmailFor("u2").orElseThrow().isEmpty());
        assertTrue(Main.emailFor("u2").isEmpty());
    }
    @Test void handlesMissingUserWithoutNestedValue() {
        assertTrue(Main.nestedEmailFor("missing").isEmpty()); assertTrue(Main.emailFor("missing").isEmpty());
    }
}
