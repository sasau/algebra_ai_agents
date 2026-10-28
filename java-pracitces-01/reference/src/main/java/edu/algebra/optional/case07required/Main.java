package edu.algebra.optional.case07required;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
public final class Main {
    /**
     * the required-value boundary, custom exception supplier and deliberately caught demonstration failures.
     */
    public static final class MissingCustomerException extends RuntimeException {
        public MissingCustomerException(String message) { super(message); }
    }
    /**
     * the required-value boundary, custom exception supplier and deliberately caught demonstration failures.
     */
    public static String requireName(String id) {
        return Optional.ofNullable(Map.of("u1", "Ada").get(id))
                .orElseThrow(() -> new MissingCustomerException("No customer: " + id));
    }
    /**
     * the required-value boundary, custom exception supplier and deliberately caught demonstration failures.
     */
    public static String unsafeEmptyGet() { return Optional.<String>empty().get(); }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("orElseThrow turns absence into an explicit failure at a boundary where a value is required.");
        System.out.println("Inputs: u1=Ada, missing u9, and deliberately unsafe get on empty; intended exceptions are caught.");
        System.out.println("RESULT u1=" + requireName("u1"));
        try { requireName("u9"); }
        catch (MissingCustomerException expected) { System.out.println("RESULT u9=MissingCustomerException: " + expected.getMessage()); }
        try { unsafeEmptyGet(); }
        catch (NoSuchElementException expected) { System.out.println("RESULT empty.get=NoSuchElementException"); }
    }
}
