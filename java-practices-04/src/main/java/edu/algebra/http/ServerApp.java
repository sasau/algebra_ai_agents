package edu.algebra.http;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.time.Clock;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** Owns one listener and its request executor. */
public final class ServerApp implements AutoCloseable {
    private final HttpServer server;
    private final ExecutorService executor;
    private final int port;
    private final AtomicBoolean closed = new AtomicBoolean();

    private ServerApp(HttpServer server, ExecutorService executor) {
        this.server = server;
        this.executor = executor;
        this.port = server.getAddress().getPort();
    }

    public static ServerApp start(ServerConfig config) throws IOException {
        return start(config, Clock.systemUTC());
    }

    public static ServerApp start(ServerConfig config, Clock clock) throws IOException {
        Objects.requireNonNull(config, "config");
        Objects.requireNonNull(clock, "clock");
        SessionStore store = new SessionStore(clock, config.sessionTtl(), config.sessionCapacity());
        return start(config, new Router(store));
    }

    /** Injects application work while keeping the real listener, admission and cleanup path. */
    public static ServerApp start(ServerConfig config, HttpHandler delegate) throws IOException {
        Objects.requireNonNull(config, "config");
        Objects.requireNonNull(delegate, "delegate");
        HttpServer server = HttpServer.create();
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        try {
            server.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), config.port()), 0);
            server.setExecutor(executor);
            server.createContext("/", new AdmissionHandler(new ErrorBoundary(delegate), config.maxInFlight()));
            ServerApp app = new ServerApp(server, executor);
            server.start();
            return app;
        } catch (IOException | RuntimeException | Error failure) {
            // The listener and executor are ours even when startup fails partway through.
            try {
                server.stop(0);
            } catch (RuntimeException cleanupFailure) {
                failure.addSuppressed(cleanupFailure);
            } finally {
                executor.shutdownNow();
            }
            throw failure;
        }
    }

    public int port() {
        return port;
    }

    /** Observation seam: callers must still bound their own wait for interrupted work to exit. */
    boolean workersTerminated() {
        return executor.isTerminated();
    }

    @Override
    public void close() {
        if (!closed.compareAndSet(false, true)) {
            return;
        }
        try {
            server.stop(1);
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(2, TimeUnit.SECONDS)) {
                    // Cancellation is bounded; an application must cooperate with interruption.
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
