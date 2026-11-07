package edu.algebra.http;

import java.io.IOException;
import java.io.PrintStream;
import java.util.concurrent.CountDownLatch;

public final class App {
    private App() { }

    public static void main(String[] args) {
        System.exit(run(args, System.out, System.err));
    }

    /** Returns an exit code so tests can exercise help and errors without terminating the JVM. */
    public static int run(String[] args, PrintStream out, PrintStream err) {
        if (args.length == 1 && "--help".equals(args[0])) {
            out.println("Usage: java -jar java-03-http-server.jar [--port N] [--help]");
            out.println("Port: 0 (assigned) or 1-65535; default 8080.");
            return 0;
        }
        final ServerConfig config;
        try {
            config = ServerConfig.parse(args);
        } catch (IllegalArgumentException e) {
            err.println(e.getMessage());
            err.println("Use --help for usage.");
            return 2;
        }
        try (ServerApp server = ServerApp.start(config)) {
            CountDownLatch stopped = new CountDownLatch(1);
            Thread hook = new Thread(() -> {
                try {
                    server.close();
                } finally {
                    stopped.countDown();
                }
            }, "java03-shutdown");
            Runtime.getRuntime().addShutdownHook(hook);
            try {
                out.println("Listening on http://127.0.0.1:" + server.port());
                out.flush();
                stopped.await();
                return 0;
            } finally {
                try {
                    Runtime.getRuntime().removeShutdownHook(hook);
                } catch (IllegalStateException shutdownInProgress) {
                    // The JVM is already running the bounded cleanup hook.
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            err.println("Server interrupted.");
            return 1;
        } catch (IOException e) {
            err.println("Cannot start server: " + e.getMessage());
            return 1;
        }
    }
}
