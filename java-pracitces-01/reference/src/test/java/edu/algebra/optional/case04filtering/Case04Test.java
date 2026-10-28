package edu.algebra.optional.case04filtering;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Case04Test {
    @Test void acceptsBoundaryAdult() {
        var customer = new Main.Customer("a", 18, true);
        assertSame(customer, Main.eligibleCustomer(customer).orElseThrow());
    }
    @Test void rejectsMinor() { assertTrue(Main.eligibleCustomer(new Main.Customer("b", 17, true)).isEmpty()); }
    @Test void rejectsInactiveAndMissing() {
        assertTrue(Main.eligibleCustomer(new Main.Customer("c", 30, false)).isEmpty());
        assertTrue(Main.eligibleCustomer(null).isEmpty());
    }
}
