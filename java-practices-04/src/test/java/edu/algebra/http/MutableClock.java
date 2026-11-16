package edu.algebra.http;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

/** Controllable time shared safely with concurrent tests; no wall-clock waiting. */
final class MutableClock extends Clock {
    private final AtomicReference<Instant> now;
    private final ZoneId zone;

    MutableClock(Instant initial) {
        this(new AtomicReference<>(Objects.requireNonNull(initial)), ZoneOffset.UTC);
    }

    private MutableClock(AtomicReference<Instant> now, ZoneId zone) {
        this.now = now;
        this.zone = zone;
    }

    void setInstant(Instant instant) {
        now.set(Objects.requireNonNull(instant));
    }

    void advance(Duration duration) {
        now.updateAndGet(instant -> instant.plus(duration));
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new MutableClock(now, Objects.requireNonNull(zone));
    }

    @Override
    public Instant instant() {
        return now.get();
    }
}
