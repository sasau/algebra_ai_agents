package edu.algebra.optional.case02lookup;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public final class Main {
    private static final Map<String, String> NAMES = Map.of("u1", "Ada");
    /**
     * the Optional return type, the present Consumer, the empty Runnable and the void result.
     */
    public static Optional<String> findName(String id) {
        Objects.requireNonNull(id);
        return Optional.ofNullable(NAMES.get(id));
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("An Optional return type makes a missing lookup result visible in the method signature.");
        System.out.println("Inputs: an in-memory u1=Ada entry, a missing u9 entry, and no external service.");
        findName("u1").ifPresentOrElse(name -> System.out.println("RESULT u1=" + name),
                () -> System.out.println("RESULT u1=not found"));
        findName("u9").ifPresentOrElse(name -> System.out.println("RESULT u9=" + name),
                () -> System.out.println("RESULT u9=not found"));
    }
}
