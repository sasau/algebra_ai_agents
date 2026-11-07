# Java APIs, mechanism parts and numbered examples

All 41 Claude-authored diagrams are included in the beginner-friendly HTML reference.
The 74-slide deck explains who calls each method, which thread runs code, what changes and who waits.
Slides 6–9 introduce Thread, Runnable, lambda syntax and the important Thread methods.
On narrow screens scroll figures horizontally to preserve readable labels.

| Figure | Slide | Java feature | Editable SVG |
|---|---:|---|---|
| JC2.1 | 2 | Concurrency — four problems when tasks overlap | [java-problems.svg](figures/java-problems.svg) |
| JC2.2 | 6 | Thread — create an object before starting its work | [thread-create.svg](figures/thread-create.svg) |
| JC2.3 | 7 | Runnable — define the work with a lambda | [runnable-create.svg](figures/runnable-create.svg) |
| JC2.4 | 8 | Thread — start(), run() and join() do different jobs | [thread-methods.svg](figures/thread-methods.svg) |
| JC2.5 | 9 | Thread — timed join, interrupt and state checks | [thread-wait-cancel.svg](figures/thread-wait-cancel.svg) |
| JC2.6 | 10 | Thread — connect the task, worker and result | [thread-parts.svg](figures/thread-parts.svg) |
| JC2.7 | 11 | Thread — a worker that never ends keeps join() waiting | [thread-stall.svg](figures/thread-stall.svg) |
| JC2.8 | 12 | Thread lifecycle — starting work does not finish it | [lifecycle-problem.svg](figures/lifecycle-problem.svg) |
| JC2.9 | 13 | Thread lifecycle — start, join, then read the result | [lifecycle-solution.svg](figures/lifecycle-solution.svg) |
| JC2.10 | 17 | CyclicBarrier and CountDownLatch — waiting and signalling | [rendezvous-parts.svg](figures/rendezvous-parts.svg) |
| JC2.11 | 18 | CyclicBarrier and CountDownLatch — handle missing signals | [rendezvous-failure.svg](figures/rendezvous-failure.svg) |
| JC2.12 | 19 | Race condition — two workers overwrite one increment | [race.svg](figures/race.svg) |
| JC2.13 | 21 | Synchronized — one monitor owner, other threads wait | [monitor-parts.svg](figures/monitor-parts.svg) |
| JC2.14 | 22 | Synchronized — an endless loop keeps the monitor locked | [monitor-stall.svg](figures/monitor-stall.svg) |
| JC2.15 | 23 | Synchronized — opposite lock orders create deadlock | [monitor-cycle.svg](figures/monitor-cycle.svg) |
| JC2.16 | 24 | Monitor — protect the whole counter update | [monitor.svg](figures/monitor.svg) |
| JC2.17 | 25 | AtomicInteger — update one counter in an indivisible step | [atomic-parts.svg](figures/atomic-parts.svg) |
| JC2.18 | 26 | AtomicInteger — separate checks and updates can still race | [atomic-check-act.svg](figures/atomic-check-act.svg) |
| JC2.19 | 27 | AtomicInteger — count both increments without losing either | [atomic.svg](figures/atomic.svg) |
| JC2.20 | 32 | ExecutorService — separate tasks from the threads running them | [executor-parts.svg](figures/executor-parts.svg) |
| JC2.21 | 33 | ExecutorService — limit queued tasks and handle rejected work | [executor-overload.svg](figures/executor-overload.svg) |
| JC2.22 | 34 | ExecutorService — waiting tasks can block their own pool | [executor-starvation.svg](figures/executor-starvation.svg) |
| JC2.23 | 35 | Future — distinguish pending, successful, failed and cancelled tasks | [future-parts.svg](figures/future-parts.svg) |
| JC2.24 | 36 | Future — cancellation does not prove the task stopped | [future-stuck.svg](figures/future-stuck.svg) |
| JC2.25 | 37 | ExecutorService — submitting work and finishing it are separate | [executor.svg](figures/executor.svg) |
| JC2.26 | 40 | Task outcomes — return values or report failures and timeouts | [task-outcomes.svg](figures/task-outcomes.svg) |
| JC2.27 | 42 | Virtual threads — run on carriers and release them when waiting | [virtual-parts.svg](figures/virtual-parts.svg) |
| JC2.28 | 43 | Virtual threads — pinning keeps a carrier occupied | [virtual-pinning.svg](figures/virtual-pinning.svg) |
| JC2.29 | 44 | Virtual threads — parked tasks free carriers for other work | [virtual.svg](figures/virtual.svg) |
| JC2.30 | 46 | Semaphore — permits limit access to a resource | [semaphore-parts.svg](figures/semaphore-parts.svg) |
| JC2.31 | 47 | Semaphore — missing or extra releases break the limit | [semaphore-leak.svg](figures/semaphore-leak.svg) |
| JC2.32 | 48 | Semaphore — trace permits, active users and waiting tasks | [semaphore.svg](figures/semaphore.svg) |
| JC2.33 | 50 | Timing experiment — compare equal work, then elapsed time | [experiment.svg](figures/experiment.svg) |
| JC2.34 | 55 | ReentrantLock — track ownership and release the lock | [lock-parts.svg](figures/lock-parts.svg) |
| JC2.35 | 56 | Dining philosophers — each worker waits for the next fork | [deadlock.svg](figures/deadlock.svg) |
| JC2.36 | 57 | Interruption — stop and join the deadlocked demonstration workers | [recovery.svg](figures/recovery.svg) |
| JC2.37 | 59 | Global lock order — take the smaller fork first | [dining.svg](figures/dining.svg) |
| JC2.38 | 64 | BlockingQueue — items, producers, consumers and waits | [queue-parts.svg](figures/queue-parts.svg) |
| JC2.39 | 65 | BlockingQueue — an outer monitor can cause deadlock | [queue-outer-lock.svg](figures/queue-outer-lock.svg) |
| JC2.40 | 66 | BlockingQueue — a full buffer makes the producer wait | [queue.svg](figures/queue.svg) |
| JC2.41 | 68 | CPU work — runnable tasks share limited processor capacity | [cpu.svg](figures/cpu.svg) |
