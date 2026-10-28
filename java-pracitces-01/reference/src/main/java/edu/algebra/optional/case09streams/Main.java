package edu.algebra.optional.case09streams;

import java.util.List;
import java.util.Optional;
public final class Main {
    /**
     * zero-or-one elements from Optional.stream and the outer Stream.flatMap operation.
     */
    public static List<String> presentNames(List<Optional<String>> names) {
        return names.stream().flatMap(Optional::stream).map(String::trim)
                .filter(name -> !name.isBlank()).toList();
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("Optional.stream converts a present Optional into a one-element Stream and an empty Optional into an empty Stream.");
        System.out.println("Inputs: spaced Ada, an empty Optional, Lin, and blank text; preserve encounter order.");
        var result = presentNames(List.of(Optional.of(" Ada "), Optional.empty(), Optional.of("Lin"), Optional.of("   ")));
        System.out.println("RESULT names=" + result);
        System.out.println("RESULT count=" + result.size());
    }
}
