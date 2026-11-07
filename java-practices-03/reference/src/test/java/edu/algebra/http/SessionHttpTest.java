package edu.algebra.http;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(15)
class SessionHttpTest {
    private static final Instant INITIAL = Instant.parse("2026-01-01T00:00:00Z");
    private static final Duration TTL = Duration.ofMinutes(30);
    private static final String CLEAR = "J03SID=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
    private final MutableClock clock = new MutableClock(INITIAL);
    private ServerApp server;
    private HttpClient client;

    @BeforeEach
    void start() throws Exception {
        server = ServerApp.start(new ServerConfig(0, TTL, 10, 32), clock);
        client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        assertTrue(client.cookieHandler().isEmpty(), "Every test explicitly chooses the transmitted cookies");
    }

    @AfterEach
    void close() {
        try {
            if (client != null) client.close();
        } finally {
            if (server != null) server.close();
        }
    }

    private void capacityOne() throws Exception {
        server.close();
        server = ServerApp.start(new ServerConfig(0, TTL, 1, 32), clock);
    }

    private HttpResponse<byte[]> request(String method, String path, String... cookieHeaders) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.port() + path))
                .timeout(Duration.ofSeconds(3)).method(method, HttpRequest.BodyPublishers.noBody());
        for (String header : cookieHeaders) builder.header("Cookie", header);
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
    }

    private static void assertText(HttpResponse<byte[]> response, int status, String text) {
        byte[] expected = text.getBytes(StandardCharsets.UTF_8);
        assertEquals(status, response.statusCode());
        assertArrayEquals(expected, response.body());
        assertEquals("text/plain; charset=utf-8", response.headers().firstValue("Content-Type").orElseThrow());
        assertEquals(Integer.toString(expected.length), response.headers().firstValue("Content-Length").orElseThrow());
    }

    private static String assertCreated(HttpResponse<byte[]> response) {
        assertText(response, 200, "visits=1\n");
        List<String> cookies = response.headers().allValues("Set-Cookie");
        assertEquals(1, cookies.size());
        String cookie = cookies.getFirst();
        assertTrue(cookie.matches("J03SID=[A-Za-z0-9_-]{22}; Path=/; HttpOnly; SameSite=Lax"));
        return cookie.substring("J03SID=".length(), cookie.indexOf(';'));
    }

    private static void assertReused(HttpResponse<byte[]> response, int visits) {
        assertText(response, 200, "visits=" + visits + "\n");
        assertTrue(response.headers().allValues("Set-Cookie").isEmpty());
    }

    private static void assertCleared(HttpResponse<byte[]> response) {
        assertEquals(204, response.statusCode());
        assertEquals(0, response.body().length);
        assertEquals(List.of(CLEAR), response.headers().allValues("Set-Cookie"));
    }

    @Test
    void creationExplicitReuseAndIsolatedSecondClient() throws Exception {
        String id = assertCreated(request("GET", "/session"));
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
        assertReused(request("GET", "/session", "J03SID=" + id), 3);
        String other = assertCreated(request("GET", "/session"));
        assertNotEquals(id, other);
        assertReused(request("GET", "/session", "J03SID=" + id), 4);
    }

    @Test
    void parsesSemicolonPairsAndAllCookieHeadersWithExactNames() throws Exception {
        String id = assertCreated(request("GET", "/session"));
        assertReused(request("GET", "/session", "theme=dark; J03SID=" + id + "; language=hr"), 2);
        assertReused(request("GET", "/session", "theme=dark", "J03SID=" + id + "; language=hr"), 3);
        String replacement = assertCreated(request("GET", "/session", "XJ03SID=" + id + "; j03sid=" + id));
        assertNotEquals(id, replacement);
        assertReused(request("GET", "/session", "J03SID=" + id), 4);
    }

    @ParameterizedTest
    @ValueSource(strings = {"J03SID=", "J03SID=bad", "J03SID=\"%s\"", "J03SID=%s; J03SID=%s",
            "J03SID", "J03SID =%s", "J03SID=%s=", "J03SID=%s; J03SID=bad", "J03SID=bad; J03SID=%s"})
    void unusableCookiesAreReplacedWithoutRevivingOrInvalidatingOldId(String pattern) throws Exception {
        String id = assertCreated(request("GET", "/session"));
        String malformed = pattern.replace("%s", id);
        String replacement = assertCreated(request("GET", "/session", malformed));
        assertNotEquals(id, replacement);
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
    }

    @Test
    void duplicateIdsAcrossSeparateHeadersAreUnusable() throws Exception {
        String id = assertCreated(request("GET", "/session"));
        String replacement = assertCreated(request("GET", "/session", "J03SID=" + id, "J03SID=" + id));
        assertNotEquals(id, replacement);
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
    }

    @Test
    void forgedValidShapeIsLookupOnly() throws Exception {
        String forged = "A".repeat(22);
        String first = assertCreated(request("GET", "/session", "J03SID=" + forged));
        String second = assertCreated(request("GET", "/session", "J03SID=" + forged));
        assertNotEquals(forged, first);
        assertNotEquals(forged, second);
        assertNotEquals(first, second);
    }

    @Test
    void absoluteExpiryReplacesCookieAtExactBoundaryWithoutSlidingOnVisits() throws Exception {
        capacityOne();
        String id = assertCreated(request("GET", "/session"));
        clock.setInstant(INITIAL.plus(TTL).minusNanos(1));
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
        clock.setInstant(INITIAL.plus(TTL));
        String replacement = assertCreated(request("GET", "/session", "J03SID=" + id));
        assertNotEquals(id, replacement);
    }

    @Test
    void deleteKnownIdClearsCookieAndReplayStartsDifferentSession() throws Exception {
        capacityOne();
        String id = assertCreated(request("GET", "/session"));
        assertCleared(request("DELETE", "/session", "J03SID=" + id));
        String replacement = assertCreated(request("GET", "/session", "J03SID=" + id));
        assertNotEquals(id, replacement);
    }

    @Test
    void deleteMissingUnknownAndMalformedCookiesNeverAllocates() throws Exception {
        capacityOne();
        assertCleared(request("DELETE", "/session"));
        assertCleared(request("DELETE", "/session", "J03SID=" + "A".repeat(22)));
        assertCleared(request("DELETE", "/session", "J03SID=bad"));
        assertCleared(request("DELETE", "/session", "J03SID"));
        assertCreated(request("GET", "/session"));
    }

    @Test
    void deletingUnusableCookiesDoesNotInvalidateExistingLiveSession() throws Exception {
        capacityOne();
        String id = assertCreated(request("GET", "/session"));
        assertCleared(request("DELETE", "/session", "J03SID=" + id + "; J03SID=" + id));
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
        assertCleared(request("DELETE", "/session", "J03SID=\"" + id + "\""));
        assertReused(request("GET", "/session", "J03SID=" + id), 3);
        assertCleared(request("DELETE", "/session", "J03SID=" + "A".repeat(22)));
        assertReused(request("GET", "/session", "J03SID=" + id), 4);
    }

    @Test
    void fullStoreReturnsFixed503WhileLiveCookieStillWorks() throws Exception {
        capacityOne();
        String id = assertCreated(request("GET", "/session"));
        HttpResponse<byte[]> full = request("GET", "/session");
        assertText(full, 503, "Session capacity reached\n");
        assertTrue(full.headers().allValues("Set-Cookie").isEmpty());
        assertReused(request("GET", "/session", "J03SID=" + id), 2);
    }

    @Test
    void unrelatedRoutesNeverAllocateSessions() throws Exception {
        capacityOne();
        assertText(request("GET", "/health", "J03SID=" + "A".repeat(22)), 200, "OK\n");
        HttpResponse<byte[]> hello = request("GET", "/hello");
        assertText(hello, 200, "Hello, world!\n");
        HttpResponse<byte[]> echo = request("POST", "/echo");
        assertEquals(200, echo.statusCode());
        assertEquals(0, echo.body().length);
        for (HttpResponse<byte[]> response : List.of(hello, echo,
                request("GET", "/health"))) assertTrue(response.headers().allValues("Set-Cookie").isEmpty());
        assertCreated(request("GET", "/session"));
    }

    @Test
    void methodsAndExactPathsFollowRoutingContract() throws Exception {
        HttpResponse<byte[]> wrong = request("POST", "/session");
        assertText(wrong, 405, "Method not allowed\n");
        assertEquals("GET, DELETE", wrong.headers().firstValue("Allow").orElseThrow());
        assertText(request("GET", "/session/extra"), 404, "Not found\n");
        HttpResponse<byte[]> head = request("HEAD", "/session");
        assertEquals(405, head.statusCode());
        assertEquals(0, head.body().length);
        assertEquals("GET, DELETE", head.headers().firstValue("Allow").orElseThrow());
        assertTrue(wrong.headers().allValues("Set-Cookie").isEmpty());
    }
}
