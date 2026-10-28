package edu.algebra.optional.case04filtering;

import java.util.Optional;
public final class Main {
    public record Customer(String id, int age, boolean active) {}
    /**
     * each predicate, why age 18 passes, why 17 fails, and why filter keeps the Customer type.
     */
    public static Optional<Customer> eligibleCustomer(Customer customer) {
        return Optional.ofNullable(customer).filter(Customer::active).filter(c -> c.age() >= 18);
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("filter keeps a present value when a predicate is true and changes it to empty when false.");
        System.out.println("Inputs: an active adult aged18, a minor aged17, an inactive adult, and a missing customer.");
        System.out.println("RESULT adult=" + eligibleCustomer(new Customer("a", 18, true)).map(c -> "eligible").orElse("empty"));
        System.out.println("RESULT minor=" + eligibleCustomer(new Customer("b", 17, true)).map(c -> "eligible").orElse("empty"));
        System.out.println("RESULT inactive=" + eligibleCustomer(new Customer("c", 30, false)).map(c -> "eligible").orElse("empty"));
        System.out.println("RESULT missing=" + eligibleCustomer(null).map(c -> "eligible").orElse("empty"));
    }
}
