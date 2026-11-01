package edu.algebra.concurrency;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Locale;

public final class Main {
    private Main() {}
    public static void main(String[] args) throws Exception {
        if (args.length == 0) throw new IllegalArgumentException("lifecycle|races|orchestration|compare|dining");
        switch (args[0]) {
            case "lifecycle" -> {
                explain("CONCEPT", "start schedules a worker; a direct run call executes on its caller.");
                explain("SETUP", "A platform worker named lesson-worker records its actual executing thread name.");
                explain("EXECUTE", "Start the worker and join it before reading its result.");
                System.out.println("RESULT started=" + Lifecycle.startAndJoin());
                explain("WHY", "join waits for termination and makes the worker's actions visible to this caller.");
                explain("EXECUTE", "Create a separate unstarted worker and call run directly from " + Thread.currentThread().getName());
                System.out.println("RESULT directRun=" + Lifecycle.directRun());
                explain("VALIDATE", "Run LifecycleTest: assertions compare the observed worker and caller names with their required values.");
            }
            case "races" -> {
                explain("CONCEPT", "An increment is a read, calculation and write. Volatile visibility does not make the whole sequence atomic.");
                explain("SETUP", "Start at zero; a barrier forces both workers to read zero before either writes snapshot + 1.");
                System.out.println("RESULT lostUpdate=" + Races.forcedLostUpdate());
                explain("INTERPRET", "Both writes contain one. The forced demonstration exposes a lost update without relying on chance.");
                explain("REPAIR", "Use the same monitor for the complete increment, then compare a single AtomicInteger update.");
                System.out.println("RESULT synchronized=" + Races.safeIncrements(false, 1000));
                System.out.println("RESULT atomic=" + Races.safeIncrements(true, 1000));
                explain("VALIDATE", "SharedStateTest requires the forced value one and 20,000 protected increments for its larger test inputs.");
            }
            case "orchestration" -> {
                explain("CONCEPT", "An executor owns task execution; the caller still owns collecting results, failures and cleanup.");
                explain("SETUP", "Three simulated shops return 1,200, 1,800 and 2,400 cents through two platform workers.");
                System.out.println("RESULT cents=" + Orchestration.quoteTotal());
                explain("WHY", "The total is returned only after every Future succeeds. A task failure propagates; unfinished work has a batch deadline.");
                explain("SETUP", "A two-slot queue contains A and B. Taking A makes space for the producer to insert C.");
                System.out.println("RESULT queue=" + Orchestration.boundedQueue());
                explain("LIMIT", "The queue result establishes FIFO transfer; the latch before put(C) does not prove an exact blocking instant.");
                explain("VALIDATE", "OrchestrationTest asserts totals, FIFO, propagated IOException, deadline cancellation and executor termination.");
            }
            case "compare" -> compare(args);
            case "dining" -> {
                explain("CONCEPT", "Pi needs Fi and F(i+1)%5. Each fork has one owner while eating.");
                explain("SETUP", "Force all five first forks to be held before any worker attempts its second fork: this forms circular wait.");
                explain("RECOVERY", "Interrupt every demonstration worker before joining any; finally releases all acquired locks.");
                System.out.println("RESULT circular=" + DiningPhilosophers.circularWait());
                explain("REPAIR", "Every philosopher acquires the lower-numbered fork first. P4 therefore takes F0 before F4.");
                explain("EXECUTE", "Run three meals per philosopher on virtual threads. The following events are recorded by actual workers.");
                var dinner = DiningPhilosophers.ordered(3, true);
                dinner.events().forEach(System.out::println);
                System.out.println("RESULT meals=" + dinner.meals());
                explain("SAFETY", "Each eating section checks exclusive fork ownership; a violation raises an error through the task Future.");
                explain("LIMIT", "Event order can vary. Global lock order prevents deadlock but these finite runs do not prove starvation freedom.");
                explain("VALIDATE", "DiningPhilosophersTest checks recovery and four meals per philosopher on both thread strategies.");
            }
            default -> throw new IllegalArgumentException("Unknown case: " + args[0]);
        }
    }

    private static void explain(String stage, String text) {
        System.out.printf("[%s] %s%n", stage, text);
    }

    /** A classroom elapsed-time experiment, not a JMH microbenchmark. */
    private static void compare(String[] args) throws Exception {
        int tasks = args.length > 1 ? Integer.parseInt(args[1]) : 120;
        int wait = args.length > 2 ? Integer.parseInt(args[2]) : 20;
        int rounds = args.length > 3 ? Integer.parseInt(args[3]) : 5;
        if (rounds < 3 || rounds > 9 || rounds % 2 == 0) {
            throw new IllegalArgumentException("Use 3, 5, 7 or 9 measured rounds");
        }
        explain("CONCEPT", "Compare equal work across execution strategies. Correctness comes from JUnit assertions; timings are observations.");
        explain("POLICY", "SEQUENTIAL runs on the caller; PLATFORM_POOL has eight reusable workers; the other modes create one thread per task.");
        explain("METHOD", "Use three warmup rounds, rotate strategy order, retain each measured sample and report its median.");
        explain("TIMER", "Include executor creation, task completion and cleanup. Prepare the job list and print these explanations outside the timer.");
        System.out.printf("ENV java=%s os=%s arch=%s cores=%d tasks=%d waitMs=%d warmups=3 rounds=%d%n",
                System.getProperty("java.version"), System.getProperty("os.name"),
                System.getProperty("os.arch"), Runtime.getRuntime().availableProcessors(), tasks, wait, rounds);
        System.out.println("kind,mode,round,completed,checksum,virtualTasks,peakActive,elapsedMs");
        for (var kind : Workloads.Kind.values()) {
            explain("WORKLOAD", kind == Workloads.Kind.BLOCKING
                    ? "BLOCKING: each task returns its numeric id after the same simulated wait. This models waiting, not a real external service."
                    : "CPU: each task returns an arithmetic checksum; signed long overflow is intentional and identical in every strategy.");
            var samples = new EnumMap<Workloads.Mode, ArrayList<Long>>(Workloads.Mode.class);
            for (var mode : Workloads.Mode.values()) samples.put(mode, new ArrayList<>());
            Long expected = null;
            for (int round = -3; round < rounds; round++) {
                var order = new ArrayList<>(Arrays.asList(Workloads.Mode.values()));
                Collections.rotate(order, Math.floorMod(round, order.size()));
                for (var mode : order) {
                    var r = Workloads.run(mode, kind, tasks, wait, 50_000, 8, 0);
                    if (expected == null) expected = r.checksum();
                    if (r.completed() != tasks || r.checksum() != expected) {
                        throw new AssertionError("Different work across execution modes");
                    }
                    if (round >= 0) {
                        samples.get(mode).add(r.elapsedNanos());
                        System.out.printf(Locale.ROOT, "%s,%s,%d,%d,%d,%d,%d,%.3f%n", kind,
                                mode, round + 1, r.completed(), r.checksum(), r.virtualTasks(),
                                r.peakActive(), r.elapsedNanos() / 1_000_000.0);
                    } else if (mode == order.get(order.size() - 1)) {
                        explain("WARMUP", kind + " round " + (round + 4) + "/3 completed with equal task counts and checksums.");
                    }
                }
            }
            for (var mode : Workloads.Mode.values()) {
                var times = samples.get(mode);
                Collections.sort(times);
                System.out.printf(Locale.ROOT, "MEDIAN %s %s %.3f ms%n", kind, mode,
                        times.get(times.size() / 2) / 1_000_000.0);
            }
            explain("INTERPRET", "completed/checksum establish equal work; virtualTasks records actual thread type; peakActive records overlapping resource use.");
        }
        explain("LIMIT", "Virtual threads do not add CPU cores or fix races. The runner does not measure memory, production throughput or scheduler fairness.");
        System.out.println("LIMIT elapsed includes startup and cleanup; sleep models waiting, not a real service");
    }
}
