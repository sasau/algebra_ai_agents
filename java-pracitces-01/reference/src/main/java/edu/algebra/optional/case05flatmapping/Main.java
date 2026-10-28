package edu.algebra.optional.case05flatmapping;

import java.util.Map;
import java.util.Optional;
public final class Main {
    public record User(String id) {}
    private static final Map<String, User> USERS = Map.of("u1", new User("u1"), "u2", new User("u2"));
    private static final Map<String, String> EMAILS = Map.of("u1", "ada@example.org");
    /**
     * Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
     */
    public static Optional<User> findUser(String id) { return Optional.ofNullable(USERS.get(id)); }
    /**
     * Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
     */
    public static Optional<String> findEmail(User user) { return Optional.ofNullable(EMAILS.get(user.id())); }
    /**
     * Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
     */
    public static Optional<Optional<String>> nestedEmailFor(String id) { return findUser(id).map(Main::findEmail); }
    /**
     * Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
     */
    public static Optional<String> emailFor(String id) { return findUser(id).flatMap(Main::findEmail); }
    /** Print narrated observations; RESULT lines are the stable values checked later. */
    public static void main(String[] args) {
        // Narration helps the student interpret the real method results below.
        System.out.println("A lookup that already returns Optional creates nesting when passed to map.");
        System.out.println("Inputs: u1 has ada@example.org; u2 has no email; a third user is missing.");
        System.out.println("RESULT map(u1)=" + nestedEmailFor("u1"));
        System.out.println("RESULT flatMap(u1)=" + emailFor("u1"));
        System.out.println("RESULT flatMap(u2)=" + emailFor("u2"));
        System.out.println("RESULT flatMap(missing)=" + emailFor("missing"));
    }
}
