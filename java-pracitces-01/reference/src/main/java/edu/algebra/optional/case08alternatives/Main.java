package edu.algebra.optional.case08alternatives;

import java.util.Optional;
import java.util.function.Supplier;
public final class Main {
    /**
     * why or stays Optional<String> and why the database supplier is skipped for a cache hit.
     */
    public static Optional<String> resolve(Supplier<Optional<String>> cache, Supplier<Optional<String>> database) {
        return cache.get().or(database);
    }
    private static final class Source implements Supplier<Optional<String>> {
        final Optional<String> value; int calls;
        Source(Optional<String> value) { this.value = value; }
        public Optional<String> get() { calls++; return value; }
    }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("or keeps the current Optional when present and calls an alternative supplier only when empty.");
        System.out.println("Inputs: fresh in-memory cache/database sources for a cache hit, a database hit, and both missing.");
        var cache = new Source(Optional.of("cache Ada")); var unusedDb = new Source(Optional.of("db Ada"));
        var first = resolve(cache, unusedDb);
        System.out.println("RESULT cache-hit=" + first + "; dbCalls=" + unusedDb.calls);
        var miss = new Source(Optional.empty()); var db = new Source(Optional.of("db Ada"));
        var second = resolve(miss, db);
        System.out.println("RESULT database-hit=" + second + "; dbCalls=" + db.calls);
        System.out.println("RESULT missing=" + resolve(Optional::empty, Optional::empty));
    }
}
