package edu.algebra.optional.case10primitive;

import java.util.Arrays;
import java.util.OptionalInt;
public final class Main {
    /**
     * missing maximum, primitive int versus Integer boxing, and the limited OptionalInt API.
     */
    public static OptionalInt maximum(int... scores) { return Arrays.stream(scores).max(); }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("Primitive-specialized optionals represent an int, long or double result without boxing it into the generic wrapper type.");
        System.out.println("Inputs: scores7,9,5 and an empty array. Empty has no maximum; zero would still be a value.");
        maximum(7, 9, 5).ifPresentOrElse(value -> System.out.println("RESULT maximum=" + value),
                () -> System.out.println("RESULT maximum=no score"));
        maximum().ifPresentOrElse(value -> System.out.println("RESULT empty=" + value),
                () -> System.out.println("RESULT empty=no score"));
    }
}
