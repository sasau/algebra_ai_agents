package edu.algebra.concurrency;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicIntegerArray;
import java.util.concurrent.locks.ReentrantLock;

/** Pi needs Fi and F(i+1)%5. Global numeric lock order removes circular wait. */
public final class DiningPhilosophers {
    private DiningPhilosophers() {}
    private static ReentrantLock[] forks() {
        var forks = new ReentrantLock[5];
        for (int i = 0; i < 5; i++) forks[i] = new ReentrantLock();
        return forks;
    }
    public record Snapshot(int heldFirstForks, boolean workersStopped) {}
    public record Dinner(List<Integer> meals, List<String> events) {}

    /** A real circular acquisition is forced, then interrupted so the lesson terminates. */
    public static Snapshot circularWait() throws Exception {
        var forks = forks();
        var holdingFirst = new CountDownLatch(5);
        var beginSecond = new CountDownLatch(1);
        var attemptingSecond = new CountDownLatch(5);
        var workers = new ArrayList<Thread>();
        for (int i = 0; i < 5; i++) {
            int id = i;
            workers.add(Thread.ofPlatform().daemon(true).name("deadlock-P" + id).unstarted(() -> {
                boolean first = false;
                boolean second = false;
                try {
                    forks[id].lockInterruptibly();
                    first = true;
                    holdingFirst.countDown();
                    beginSecond.await();
                    attemptingSecond.countDown();
                    forks[(id + 1) % 5].lockInterruptibly();
                    second = true;
                } catch (InterruptedException expectedDuringRecovery) {
                    Thread.currentThread().interrupt();
                } finally {
                    if (second) forks[(id + 1) % 5].unlock();
                    if (first) forks[id].unlock();
                }
            }));
        }
        int held;
        try {
            workers.forEach(Thread::start);
            if (!holdingFirst.await(3, TimeUnit.SECONDS)) throw new TimeoutException("First forks");
            held = 5; // All five first forks are held; nobody can acquire their second fork.
            beginSecond.countDown();
            if (!attemptingSecond.await(3, TimeUnit.SECONDS)) throw new TimeoutException("Second forks");
        } finally {
            // Interrupt every worker before joining any one of them.
            workers.forEach(Thread::interrupt);
            for (var worker : workers) worker.join(2000);
        }
        return new Snapshot(held, workers.stream().noneMatch(Thread::isAlive));
    }

    public static Dinner ordered(int rounds, boolean virtual) throws Exception {
        if (rounds < 1 || rounds > 50) throw new IllegalArgumentException("rounds must be 1..50");
        var forks = forks();
        var meals = new AtomicIntegerArray(5);
        var owners = new AtomicIntegerArray(5);
        for (int i = 0; i < 5; i++) owners.set(i, -1);
        List<String> events = Collections.synchronizedList(new ArrayList<>());
        var jobs = new ArrayList<Callable<Void>>();
        for (int i = 0; i < 5; i++) {
            int id = i;
            jobs.add(() -> {
                int left = id;
                int right = (id + 1) % 5;
                int first = Math.min(left, right);
                int second = Math.max(left, right);
                for (int round = 0; round < rounds; round++) {
                    events.add("P" + id + " HUNGRY");
                    forks[first].lockInterruptibly();
                    try {
                        forks[second].lockInterruptibly();
                        try {
                            // Instrument the exclusive-use invariant; this is separate from timing.
                            if (!owners.compareAndSet(first, -1, id)
                                    || !owners.compareAndSet(second, -1, id)) {
                                throw new AssertionError("Fork used by adjacent eaters");
                            }
                            try {
                                events.add("P" + id + " EATING F" + left + "+F" + right);
                                Thread.sleep(1); // Simulated eating, never a coordination mechanism.
                                meals.incrementAndGet(id);
                            } finally {
                                owners.set(first, -1);
                                owners.set(second, -1);
                                events.add("P" + id + " THINKING");
                            }
                        } finally { forks[second].unlock(); }
                    } finally { forks[first].unlock(); }
                }
                return null;
            });
        }
        try (var executor = virtual ? Executors.newVirtualThreadPerTaskExecutor()
                : Executors.newFixedThreadPool(5)) {
            for (var future : executor.invokeAll(jobs, 5, TimeUnit.SECONDS)) {
                if (future.isCancelled()) throw new TimeoutException("Dinner deadline");
                future.get();
            }
        }
        var counts = new ArrayList<Integer>();
        for (int i = 0; i < 5; i++) counts.add(meals.get(i));
        return new Dinner(List.copyOf(counts), List.copyOf(events));
    }
}
