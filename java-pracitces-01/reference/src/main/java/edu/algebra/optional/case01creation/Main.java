package edu.algebra.optional.case01creation;

import java.util.Optional;

public final class Main {
    /**
     * Reject null; of requires a real contained value.
     */
    public static Optional<String> requiredName(String name) { return Optional.of(name); }
    /**
     * Convert a nullable boundary value into present or empty.
     */
    public static Optional<String> nullableName(String name) { return Optional.ofNullable(name); }
    /**
     * Return explicit absence as a nonnull Optional.
     */
    public static Optional<String> emptyName() { return Optional.empty(); }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("An Optional<T> contains one nonnull T or no value.");
        System.out.println("Inputs: required Ada, nullable null, explicit empty, and deliberately invalid required null.");
        System.out.println("RESULT of=" + requiredName("Ada").orElseThrow());
        System.out.println("RESULT ofNullable(null)=" + nullableName(null));
        System.out.println("RESULT empty.isEmpty=" + emptyName().isEmpty());
        try { requiredName(null); }
        catch (NullPointerException expected) { System.out.println("RESULT of(null)=NullPointerException"); }
    }
}
