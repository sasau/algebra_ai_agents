package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(15)
class SessionStoreTest {
    private static final Instant INITIAL = Instant.parse("2026-01-01T00:00:00Z");
    private static final Duration TTL = Duration.ofMinutes(30);

    private static void assertCreated(SessionStore.Visit visit) {
        assertTrue(visit.created());
        assertEquals(1, visit.visits());
        assertTrue(visit.id().matches("[A-Za-z0-9_-]{22}"), "IDs use fixed unpadded base64url format");
        assertEquals(16, Base64.getUrlDecoder().decode(visit.id()).length);
    }

    private static void shutdown(ExecutorService executor) throws InterruptedException {
        executor.shutdownNow();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS), "Test workers must terminate");
    }

    @Test
    void firstRepeatAndIndependentClientsKeepTheirOwnCounts() {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 10);
        SessionStore.Visit first = store.visit(null);
        SessionStore.Visit other = store.visit(null);
        assertCreated(first);
        assertCreated(other);
        assertNotEquals(first.id(), other.id());
        SessionStore.Visit repeat = store.visit(first.id());
        assertEquals(first.id(), repeat.id());
        assertFalse(repeat.created());
        assertEquals(2, repeat.visits());
        assertEquals(2, store.visit(other.id()).visits());
        assertEquals(3, store.visit(first.id()).visits());
        assertEquals(2, store.size());
    }

    @Test
    void unknownCandidatesAreLookupOnlyAndNeverBecomeNewKeys() {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 10);
        String unknown = "A".repeat(22);
        SessionStore.Visit replacement = store.visit(unknown);
        assertCreated(replacement);
        assertNotEquals(unknown, replacement.id());
        SessionStore.Visit replay = store.visit(unknown);
        assertCreated(replay);
        assertNotEquals(unknown, replay.id());
        assertNotEquals(replacement.id(), replay.id());
        assertEquals(2, store.size());
    }

    @Test
    void invalidationIsIdempotentAndDeletedIdCannotBeRevived() {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 2);
        SessionStore.Visit original = store.visit(null);
        store.invalidate(original.id());
        store.invalidate(original.id());
        store.invalidate(null);
        store.invalidate("unknown");
        assertEquals(0, store.size());
        SessionStore.Visit replacement = store.visit(original.id());
        assertCreated(replacement);
        assertNotEquals(original.id(), replacement.id());
        assertEquals(1, store.size());
    }

    @Test
    void expiryIsAbsoluteAndIncludesTheExactBoundary() {
        MutableClock clock = new MutableClock(INITIAL);
        SessionStore store = new SessionStore(clock, TTL, 2);
        SessionStore.Visit original = store.visit(null);
        clock.setInstant(INITIAL.plus(TTL).minusNanos(1));
        SessionStore.Visit before = store.visit(original.id());
        assertEquals(original.id(), before.id());
        assertEquals(2, before.visits());
        assertFalse(before.created());
        clock.setInstant(INITIAL.plus(TTL));
        SessionStore.Visit boundary = store.visit(original.id());
        assertCreated(boundary);
        assertNotEquals(original.id(), boundary.id(), "Repeat visits must not extend creation expiry");
        assertEquals(1, store.size());
    }

    @Test
    void fullCapacityRejectsNewSessionsButAllowsExistingLiveSession() {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 1);
        SessionStore.Visit existing = store.visit(null);
        assertThrows(SessionCapacityException.class, () -> store.visit(null));
        assertThrows(SessionCapacityException.class, () -> store.visit("A".repeat(22)));
        SessionStore.Visit reused = store.visit(existing.id());
        assertEquals(existing.id(), reused.id());
        assertEquals(2, reused.visits());
        assertFalse(reused.created());
        assertEquals(1, store.size());
    }

    @Test
    void removesExpiredEntriesBeforeCapacityAndOnSizeAndInvalidateOperations() {
        MutableClock clock = new MutableClock(INITIAL);
        SessionStore store = new SessionStore(clock, Duration.ofSeconds(10), 2);
        SessionStore.Visit first = store.visit(null);
        clock.advance(Duration.ofSeconds(5));
        SessionStore.Visit later = store.visit(null);
        clock.advance(Duration.ofSeconds(5));
        SessionStore.Visit replacement = store.visit(first.id());
        assertCreated(replacement);
        assertNotEquals(first.id(), replacement.id());
        assertEquals(2, store.size());
        assertEquals(2, store.visit(later.id()).visits());
        clock.advance(Duration.ofSeconds(5));
        assertEquals(1, store.size());
        clock.advance(Duration.ofSeconds(5));
        store.invalidate("unknown");
        assertEquals(0, store.size());
    }

    @Test
    void twoHundredConcurrentVisitsProduceEveryCountExactlyOnce() throws Exception {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 10);
        String id = store.visit(null).id();
        ExecutorService executor = Executors.newFixedThreadPool(16);
        CountDownLatch ready = new CountDownLatch(16);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<SessionStore.Visit>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < 200; i++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertTrue(start.await(5, TimeUnit.SECONDS));
                    return store.visit(id);
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            Set<Long> counts = new HashSet<>();
            for (Future<SessionStore.Visit> future : futures) {
                SessionStore.Visit visit = future.get(5, TimeUnit.SECONDS);
                assertEquals(id, visit.id());
                assertFalse(visit.created());
                assertTrue(counts.add(visit.visits()), "Concurrent increments must not duplicate counts");
            }
            assertEquals(LongStream.rangeClosed(2, 201).boxed().collect(Collectors.toSet()), counts);
            assertEquals(202, store.visit(id).visits());
            assertEquals(1, store.size());
        } finally {
            start.countDown();
            shutdown(executor);
        }
    }

    @Test
    void concurrentCreationNeverExceedsCapacity() throws Exception {
        int capacity = 7;
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, capacity);
        ExecutorService executor = Executors.newFixedThreadPool(12);
        CountDownLatch ready = new CountDownLatch(12);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger maxObservedSize = new AtomicInteger();
        List<Future<SessionStore.Visit>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < 60; i++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertTrue(start.await(5, TimeUnit.SECONDS));
                    try {
                        return store.visit(null);
                    } catch (SessionCapacityException full) {
                        return null;
                    } finally {
                        maxObservedSize.accumulateAndGet(store.size(), Math::max);
                        assertTrue(store.size() <= capacity);
                    }
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            Set<String> ids = new HashSet<>();
            int rejected = 0;
            for (Future<SessionStore.Visit> future : futures) {
                SessionStore.Visit visit = future.get(5, TimeUnit.SECONDS);
                if (visit == null) rejected++;
                else {
                    assertCreated(visit);
                    assertTrue(ids.add(visit.id()));
                }
            }
            assertEquals(capacity, ids.size());
            assertEquals(60 - capacity, rejected);
            assertEquals(capacity, maxObservedSize.get());
            assertEquals(capacity, store.size());
        } finally {
            start.countDown();
            shutdown(executor);
        }
    }

    @Test
    void visitCompletedBeforeInvalidationMayCountButVisitAfterItGetsANewId() throws Exception {
        SessionStore store = new SessionStore(new MutableClock(INITIAL), TTL, 2);
        String id = store.visit(null).id();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch visited = new CountDownLatch(1);
        try {
            Future<SessionStore.Visit> before = executor.submit(() -> {
                try {
                    return store.visit(id);
                } finally {
                    visited.countDown();
                }
            });
            Future<SessionStore.Visit> after = executor.submit(() -> {
                assertTrue(visited.await(5, TimeUnit.SECONDS));
                store.invalidate(id);
                return store.visit(id);
            });
            assertEquals(2, before.get(5, TimeUnit.SECONDS).visits());
            SessionStore.Visit replacement = after.get(5, TimeUnit.SECONDS);
            assertCreated(replacement);
            assertNotEquals(id, replacement.id());
            assertEquals(1, store.size());
        } finally {
            visited.countDown();
            shutdown(executor);
        }
    }
}
