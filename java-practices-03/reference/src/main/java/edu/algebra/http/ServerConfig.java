package edu.algebra.http;

import java.time.Duration;
import java.util.Objects;

/** Immutable runtime limits; the command line currently exposes only the port. */
public record ServerConfig(int port, Duration sessionTtl, int sessionCapacity, int maxInFlight) {
    public ServerConfig {
        if (port < 0 || port > 65535) {
            throw new IllegalArgumentException("Port must be between 0 and 65535");
        }
        Objects.requireNonNull(sessionTtl, "sessionTtl");
        if (sessionTtl.isZero() || sessionTtl.isNegative()) {
            throw new IllegalArgumentException("Session TTL must be positive");
        }
        if (sessionCapacity < 1 || maxInFlight < 1) {
            throw new IllegalArgumentException("Capacity and maximum in-flight requests must be positive");
        }
    }

    public static ServerConfig defaults() {
        return new ServerConfig(8080, Duration.ofMinutes(30), 1000, 32);
    }

    public static ServerConfig parse(String[] args) {
        Objects.requireNonNull(args, "args");
        ServerConfig defaults = defaults();
        int port = defaults.port();
        boolean portSeen = false;
        for (int i = 0; i < args.length; i++) {
            if (!"--port".equals(args[i]) || portSeen) {
                throw new IllegalArgumentException("Unknown or repeated argument: " + args[i]);
            }
            if (++i == args.length) {
                throw new IllegalArgumentException("Missing value for --port");
            }
            try {
                port = Integer.parseInt(args[i]);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Port must be an integer", e);
            }
            portSeen = true;
        }
        return new ServerConfig(port, defaults.sessionTtl(), defaults.sessionCapacity(), defaults.maxInFlight());
    }
}
