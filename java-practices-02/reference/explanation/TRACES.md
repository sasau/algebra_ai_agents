# Java mechanism parts, failures and execution traces

All 37 Claude-authored diagrams are included in the detailed HTML reference.
Identify the parts and waiting condition, examine failure/mitigation, then read the numbered execution.
On a narrow screen, scroll each diagram horizontally to preserve readable labels.

| Figure | Slide | Java mechanism | Editable SVG |
|---|---:|---|---|
| JC2.1 | 2 | Concurrency — four problems Java must coordinate | [java-problems.svg](figures/java-problems.svg) |
| JC2.2 | 6 | Thread — identify the task, worker and completion boundary | [thread-parts.svg](figures/thread-parts.svg) |
| JC2.3 | 7 | Thread — an unfinished worker can keep join waiting | [thread-stall.svg](figures/thread-stall.svg) |
| JC2.4 | 8 | Thread lifecycle — starting work does not finish it | [lifecycle-problem.svg](figures/lifecycle-problem.svg) |
| JC2.5 | 9 | Thread lifecycle — start work, join, then read | [lifecycle-solution.svg](figures/lifecycle-solution.svg) |
| JC2.6 | 13 | Barrier and latch — name the participants and release condition | [rendezvous-parts.svg](figures/rendezvous-parts.svg) |
| JC2.7 | 14 | Barrier and latch — missing signals need bounded failure handling | [rendezvous-failure.svg](figures/rendezvous-failure.svg) |
| JC2.8 | 15 | Race condition — both workers can overwrite one update | [race.svg](figures/race.svg) |
| JC2.9 | 17 | Synchronized — identify the monitor, block and blocked contenders | [monitor-parts.svg](figures/monitor-parts.svg) |
| JC2.10 | 18 | Synchronized — an endless protected loop prevents entry | [monitor-stall.svg](figures/monitor-stall.svg) |
| JC2.11 | 19 | Synchronized — opposite nested lock orders create a true deadlock | [monitor-cycle.svg](figures/monitor-cycle.svg) |
| JC2.12 | 20 | Monitor — serialize the complete counter update | [monitor.svg](figures/monitor.svg) |
| JC2.13 | 21 | AtomicInteger — identify the shared value and operation boundary | [atomic-parts.svg](figures/atomic-parts.svg) |
| JC2.14 | 22 | AtomicInteger — separate checks and updates can still race | [atomic-check-act.svg](figures/atomic-check-act.svg) |
| JC2.15 | 23 | AtomicInteger — make one counter transition indivisible | [atomic.svg](figures/atomic.svg) |
| JC2.16 | 28 | ExecutorService — identify tasks, workers, queue and outcome receipts | [executor-parts.svg](figures/executor-parts.svg) |
| JC2.17 | 29 | ExecutorService — bound the backlog and handle rejected work | [executor-overload.svg](figures/executor-overload.svg) |
| JC2.18 | 30 | ExecutorService — dependent tasks can exhaust their own pool | [executor-starvation.svg](figures/executor-starvation.svg) |
| JC2.19 | 31 | Future — identify pending, successful, failed and cancelled outcomes | [future-parts.svg](figures/future-parts.svg) |
| JC2.20 | 32 | Cancellation — a cancelled Future can leave work running | [future-stuck.svg](figures/future-stuck.svg) |
| JC2.21 | 33 | ExecutorService — submission and completion are separate | [executor.svg](figures/executor.svg) |
| JC2.22 | 36 | Task outcomes — values, failures and deadlines reach the caller | [task-outcomes.svg](figures/task-outcomes.svg) |
| JC2.23 | 38 | Virtual threads — identify task, Java thread, carrier and processor | [virtual-parts.svg](figures/virtual-parts.svg) |
| JC2.24 | 39 | Virtual threads — distinguish pinning from resource-capacity limits | [virtual-pinning.svg](figures/virtual-pinning.svg) |
| JC2.25 | 40 | Virtual threads — waiting tasks can share carriers | [virtual.svg](figures/virtual.svg) |
| JC2.26 | 42 | Semaphore — identify permits, resource users and waiting tasks | [semaphore-parts.svg](figures/semaphore-parts.svg) |
| JC2.27 | 43 | Semaphore — leaks and extra releases break the capacity policy | [semaphore-leak.svg](figures/semaphore-leak.svg) |
| JC2.28 | 44 | Semaphore — track permits, users and waiting tasks | [semaphore.svg](figures/semaphore.svg) |
| JC2.29 | 46 | Timing experiment — compare equal work before elapsed time | [experiment.svg](figures/experiment.svg) |
| JC2.30 | 51 | ReentrantLock — identify ownership, hold count and explicit release | [lock-parts.svg](figures/lock-parts.svg) |
| JC2.31 | 52 | Dining philosophers — each worker waits for its neighbour | [deadlock.svg](figures/deadlock.svg) |
| JC2.32 | 53 | Interruption — recover the controlled circular wait | [recovery.svg](figures/recovery.svg) |
| JC2.33 | 55 | Global lock order — acquire smaller fork before larger fork | [dining.svg](figures/dining.svg) |
| JC2.34 | 60 | BlockingQueue — identify buffer, producer, consumer and wait conditions | [queue-parts.svg](figures/queue-parts.svg) |
| JC2.35 | 61 | BlockingQueue — an external monitor can close a deadlock cycle | [queue-outer-lock.svg](figures/queue-outer-lock.svg) |
| JC2.36 | 62 | BlockingQueue — a full buffer slows the producer | [queue.svg](figures/queue.svg) |
| JC2.37 | 64 | CPU work — runnable tasks share finite execution capacity | [cpu.svg](figures/cpu.svg) |

Schedules are illustrative unless Java coordination establishes the order.
Failure/mitigation panels are conceptual scenarios; they are not additional runnable test cases.
Dining animates one spoon at the eating step while ownership labels remain fixed.
This revision changes no Java implementation, test or Maven configuration.
