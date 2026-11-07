package edu.algebra.http;

public final class SessionCapacityException extends RuntimeException {
    public SessionCapacityException() {
        super("Session capacity reached");
    }
}
