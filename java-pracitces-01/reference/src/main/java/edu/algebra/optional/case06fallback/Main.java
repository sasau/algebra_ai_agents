package edu.algebra.optional.case06fallback;

import java.util.Optional;
import java.util.function.Supplier;
public final class Main {
    /**
     * argument evaluation before orElse and supplier execution only for empty orElseGet.
     */
    public static String eagerName(Optional<String> name, Supplier<String> fallback) {
        // Java evaluates this argument before orElse sees whether name is present.
        return name.orElse(fallback.get());
    }
    /**
     * argument evaluation before orElse and supplier execution only for empty orElseGet.
     */
    public static String lazyName(Optional<String> name, Supplier<String> fallback) {
        // Passing the supplier defers its invocation until an empty result needs it.
        return name.orElseGet(fallback);
    }
    private static final class Probe {
        int calls;
        String fallback() { calls++; return "guest"; }
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("orElse receives an already evaluated argument, even when the Optional is present.");
        System.out.println("Inputs: present Ada and empty. Each fresh fallback counter returns guest and records calls.");
        var eager = new Probe(); var lazy = new Probe(); var absent = new Probe();
        String a = eagerName(Optional.of("Ada"), eager::fallback);
        String b = lazyName(Optional.of("Ada"), lazy::fallback);
        String c = lazyName(Optional.empty(), absent::fallback);
        System.out.println("RESULT present.orElse=" + a + "; fallbackCalls=" + eager.calls);
        System.out.println("RESULT present.orElseGet=" + b + "; fallbackCalls=" + lazy.calls);
        System.out.println("RESULT empty.orElseGet=" + c + "; fallbackCalls=" + absent.calls);
    }
}
