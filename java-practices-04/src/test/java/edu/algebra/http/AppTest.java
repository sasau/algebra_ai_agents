package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.Arguments;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.net.BindException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class AppTest {
    @Test
    void defaultConfigurationUsesSpecifiedLimits() {
        ServerConfig config = ServerConfig.parse(new String[0]);
        assertAll(
                () -> assertEquals(8080, config.port()),
                () -> assertEquals(Duration.ofMinutes(30), config.sessionTtl()),
                () -> assertEquals(1000, config.sessionCapacity()),
                () -> assertEquals(32, config.maxInFlight()),
                () -> assertEquals(ServerConfig.defaults(), config));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 65535})
    void acceptsBoundaryPorts(int port) {
        ServerConfig config = ServerConfig.parse(new String[]{"--port", Integer.toString(port)});
        assertEquals(port, config.port());
        assertEquals(Duration.ofMinutes(30), config.sessionTtl());
        assertEquals(1000, config.sessionCapacity());
        assertEquals(32, config.maxInFlight());
    }

    static Stream<Arguments> invalidArguments() {
        return Stream.of(
                new String[]{"--port", "-1"},
                new String[]{"--port", "65536"},
                new String[]{"--port", "abc"},
                new String[]{"--port", "2147483648"},
                new String[]{"--port"},
                new String[]{"--unknown"},
                new String[]{"--port", "0", "--port", "1"},
                new String[]{"--help", "unexpected"})
                .map(arguments -> Arguments.of((Object) arguments));
    }

    @ParameterizedTest
    @MethodSource("invalidArguments")
    void rejectsInvalidArgumentsWithExitTwo(String[] arguments) {
        assertThrows(IllegalArgumentException.class, () -> ServerConfig.parse(arguments));
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();
        try (PrintStream out = new PrintStream(stdout, true, StandardCharsets.UTF_8);
             PrintStream err = new PrintStream(stderr, true, StandardCharsets.UTF_8)) {
            assertEquals(2, App.run(arguments, out, err));
        }
        assertEquals("", stdout.toString(StandardCharsets.UTF_8));
        assertTrue(stderr.toString(StandardCharsets.UTF_8).contains("Use --help"));
    }

    @Test
    void helpSucceedsPromptlyEvenWhenDefaultPortCannotBeOpened() throws Exception {
        // Reserve the CLI's fixed default, or use an existing listener as the
        // obstruction. A help path that tries normal startup cannot bind it.
        ServerSocket reserved = new ServerSocket();
        try {
            reserved.setReuseAddress(false);
            try {
                reserved.bind(new java.net.InetSocketAddress(InetAddress.getByName("127.0.0.1"), 8080));
            } catch (BindException alreadyOccupied) {
                reserved.close();
            }
            ByteArrayOutputStream stdout = new ByteArrayOutputStream();
            ByteArrayOutputStream stderr = new ByteArrayOutputStream();
            try (PrintStream out = new PrintStream(stdout, true, StandardCharsets.UTF_8);
                 PrintStream err = new PrintStream(stderr, true, StandardCharsets.UTF_8)) {
                assertTimeoutPreemptively(Duration.ofSeconds(2),
                        () -> assertEquals(0, App.run(new String[]{"--help"}, out, err)));
            }
            assertTrue(stdout.toString(StandardCharsets.UTF_8).contains("Usage:"));
            assertTrue(stdout.toString(StandardCharsets.UTF_8).contains("--port"));
            assertEquals("", stderr.toString(StandardCharsets.UTF_8));
        } finally {
            reserved.close();
        }
    }
}
