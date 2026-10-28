package edu.algebra.optional.case03mapping;

import java.util.Optional;
public final class Main {
    /**
     * Optional<String> -> Optional<Integer>, skipped mappers on empty, and present zero for blank text.
     */
    public static Optional<Integer> trimmedLength(String input) {
        // Empty skips both mappers; a present blank String can still map to zero.
        return Optional.ofNullable(input).map(String::trim).map(String::length);
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("map applies a function only when a value is present.");
        System.out.println("Inputs: a spaced Ada name, null, and three spaces. Watch present zero versus absence.");
        System.out.println("RESULT present.length=" + trimmedLength(" Ada "));
        System.out.println("RESULT missing.length=" + trimmedLength(null));
        System.out.println("RESULT blank.length=" + trimmedLength("   "));
    }
}
