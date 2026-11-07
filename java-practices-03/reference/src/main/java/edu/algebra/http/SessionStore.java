package edu.algebra.http;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/** Small in-memory store. Its monitor linearizes visits, expiry, capacity and deletion. */
public final class SessionStore {
    private final Clock clock;
    private final Duration ttl;
    private final int capacity;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Entry> sessions = new HashMap<>();

    public SessionStore(Clock clock, Duration ttl, int capacity) {
        this.clock = Objects.requireNonNull(clock, "clock");
        this.ttl = Objects.requireNonNull(ttl, "ttl");
        if (ttl.isZero() || ttl.isNegative() || capacity < 1) {
            throw new IllegalArgumentException("TTL and capacity must be positive");
        }
        this.capacity = capacity;
    }

    public Visit visit(String candidateId) {
        while (true) {
            // Random generation may consult the OS; keep it outside the state monitor.
            String freshId = newId();
            synchronized (this) {
                Instant now = clock.instant();
                purgeExpired(now);
                Entry entry = sessions.get(candidateId);
                if (entry != null) {
                    return new Visit(candidateId, ++entry.visits, false);
                }
                if (sessions.size() >= capacity) {
                    throw new SessionCapacityException();
                }
                // Candidates are lookup-only, even in the extraordinarily unlikely random collision.
                if (freshId.equals(candidateId) || sessions.containsKey(freshId)) {
                    continue;
                }
                sessions.put(freshId, new Entry(now.plus(ttl)));
                return new Visit(freshId, 1, true);
            }
        }
    }

    public synchronized void invalidate(String id) {
        purgeExpired(clock.instant());
        sessions.remove(id);
    }

    public synchronized int size() {
        purgeExpired(clock.instant());
        return sessions.size();
    }

    private void purgeExpired(Instant now) {
        sessions.values().removeIf(entry -> !now.isBefore(entry.expiresAt));
    }

    private String newId() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        // 128 random bits encoded as exactly 22 unpadded base64url characters.
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static boolean isValidId(String id) {
        if (id == null || id.length() != 22) {
            return false;
        }
        for (int i = 0; i < id.length(); i++) {
            char c = id.charAt(i);
            if (!(c >= 'a' && c <= 'z') && !(c >= 'A' && c <= 'Z')
                    && !(c >= '0' && c <= '9') && c != '_' && c != '-') {
                return false;
            }
        }
        return true;
    }

    public record Visit(String id, long visits, boolean created) { }

    private static final class Entry {
        private final Instant expiresAt;
        private long visits = 1;

        private Entry(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }
    }
}
