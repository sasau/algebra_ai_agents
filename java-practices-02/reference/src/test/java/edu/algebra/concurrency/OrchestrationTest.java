package edu.algebra.concurrency;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import static edu.algebra.concurrency.LessonConsole.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(LessonConsole.class)
@Timeout(15)
class OrchestrationTest {
    @Test @DisplayName("Futures: collect every quote before returning the 5,400-cent total")
    void futuresCollectEveryQuote() throws Exception {
        say("CONCEPT", "Submitting a Callable creates pending work; collecting its Future establishes its outcome.");
        say("SETUP", "Three independent shop quotes return 1,200, 1,800 and 2,400 cents on a pool of two workers.");
        equal("sum of all successful quote results", 5400, Orchestration.quoteTotal(),
                "The aggregator must read every Future. A partial total or successful submission alone is not completion.");
        say("LIMIT", "The fixed pool bounds workers, but its default task queue is unbounded.");
    }

    @Test @DisplayName("BlockingQueue: removing A allows C to enter a full two-slot queue")
    void boundedQueueTransfersItemsInFifoOrder() throws Exception {
        say("CONCEPT", "A bounded queue applies backpressure and coordinates transfer without polling.");
        say("SETUP", "Capacity is two. Prefill A and B; a producer attempts put(C); the consumer removes A.");
        equal("FIFO transfer", List.of("A", "B", "C"), Orchestration.boundedQueue(),
                "Removing A frees capacity, producer completion makes C available, and FIFO ordering keeps B before C.");
        say("LIMIT", "The pre-put latch signals progress to that line; it does not prove the producer was already blocked.");
    }

    @Test @DisplayName("Task failure: the quote aggregator exposes the worker's IOException")
    void failureReachesFutureCaller() {
        say("CONCEPT", "A worker exception must reach the coordinating caller rather than disappear in a Future.");
        say("SETUP", "Inject a quote Callable that throws IOException with message shop unavailable.");
        Callable<Integer> brokenShop = () -> { throw new IOException("shop unavailable"); };
        say("EXPECT", "collectQuotes must throw ExecutionException with the original IOException as its cause.");
        ExecutionException failure = assertThrows(ExecutionException.class,
                () -> Orchestration.collectQuotes(List.of(brokenShop), Duration.ofSeconds(2)));
        say("OBSERVED", failure.getClass().getSimpleName() + " caused by " + failure.getCause());
        holds("original cause is preserved", failure.getCause() instanceof IOException,
                "The aggregator calls get on the Future, so the original shop failure remains available for diagnosis.");
        equal("worker error message", "shop unavailable", failure.getCause().getMessage(),
                "A generic replacement exception would hide the information the caller needs.");
    }

    @Test @DisplayName("Batch deadline: cancel unfinished quote work and release its blocked worker")
    void deadlineCancelsUnfinishedQuote() throws Exception {
        say("CONCEPT", "A batch deadline limits waiting and requests cancellation of unfinished tasks.");
        var started = new CountDownLatch(1);
        var stopped = new CountDownLatch(1);
        var neverReleased = new CountDownLatch(1);
        Callable<Integer> waitingShop = () -> {
            started.countDown();
            try {
                neverReleased.await(); // Only cancellation can release this wait during the test.
                return 0;
            } finally { stopped.countDown(); }
        };
        say("SETUP", "One shop waits on a latch. Set the batch deadline to one second; no sleep is used for coordination.");
        say("EXPECT", "The real aggregator throws TimeoutException and its interruptible worker leaves its wait.");
        TimeoutException failure = assertThrows(TimeoutException.class,
                () -> Orchestration.collectQuotes(List.of(waitingShop), Duration.ofSeconds(1)));
        say("OBSERVED", failure.getClass().getSimpleName() + ": " + failure.getMessage());
        equal("worker actually started", 0L, started.getCount(), "The test exercised a running blocked task.");
        holds("worker left its wait", stopped.await(2, TimeUnit.SECONDS),
                "Timed invokeAll cancels unfinished Futures; interruption reaches latch.await and cleanup completes.");
        say("LIMIT", "A deadline is not a forced stop. A task that ignores interruption can still delay executor cleanup.");
    }

    @Test @DisplayName("Cancellation: cancel(true) interrupts a task and shutdown reaches termination")
    void cancellationInterruptsTaskAndAllowsExecutorToTerminate() throws Exception {
        var started = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        var neverReleased = new CountDownLatch(1);
        var executor = Executors.newSingleThreadExecutor();
        say("CONCEPT", "Interruption is a cooperative request, so observe both the request and task response.");
        say("SETUP", "A worker announces it started and waits interruptibly on a latch.");
        try {
            var future = executor.submit(() -> {
                started.countDown();
                try { neverReleased.await(); }
                catch (InterruptedException expected) {
                    interrupted.countDown();
                    Thread.currentThread().interrupt(); // Preserve the cancellation status before returning.
                }
            });
            holds("task reached its start boundary", started.await(2, TimeUnit.SECONDS),
                    "The test requests cancellation only after the worker is running.");
            holds("cancellation accepted", future.cancel(true), "The request targets an unfinished Future.");
            holds("task observed interruption", interrupted.await(2, TimeUnit.SECONDS),
                    "An accepted request alone does not establish that the task responded.");
            holds("Future is cancelled", future.isCancelled(), "The caller can observe the cancellation state.");
        } finally {
            executor.shutdownNow();
            holds("executor terminated", executor.awaitTermination(2, TimeUnit.SECONDS),
                    "A shutdown request must be followed by observed termination before this build step is validated.");
        }
    }
}
