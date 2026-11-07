package edu.algebra.http;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(15)
class RoutingTest {
    private ServerApp server;
    private HttpClient client;

    @BeforeEach
    void start() throws Exception {
        ServerConfig defaults = ServerConfig.defaults();
        server = ServerApp.start(new ServerConfig(0, defaults.sessionTtl(),
                defaults.sessionCapacity(), defaults.maxInFlight()));
        client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    }

    @AfterEach
    void close() {
        try {
            if (client != null) client.close();
        } finally {
            if (server != null) server.close();
        }
    }

    private HttpResponse<byte[]> request(String method, String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.port() + path))
                        .timeout(Duration.ofSeconds(3))
                        .method(method, HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofByteArray());
    }

    private static void assertText(HttpResponse<byte[]> response, int status, String text) {
        byte[] expected = text.getBytes(StandardCharsets.UTF_8);
        assertAll(
                () -> assertEquals(status, response.statusCode()),
                () -> assertArrayEquals(expected, response.body()),
                () -> assertEquals("text/plain; charset=utf-8",
                        response.headers().firstValue("Content-Type").orElseThrow()),
                () -> assertEquals(Integer.toString(expected.length),
                        response.headers().firstValue("Content-Length").orElseThrow()),
                () -> assertTrue(response.headers().allValues("Set-Cookie").isEmpty()));
    }

    @Test
    void absentNameUsesWorld() throws Exception {
        assertText(request("GET", "/hello"), 200, "Hello, world!\n");
        assertText(request("GET", "/hello?other=well+formed&unused=%C4%8D"), 200, "Hello, world!\n");
    }

    @ParameterizedTest
    @CsvSource({"Ada,Ada", "Ana+Maria,Ana Maria", "%C5%BDeljka+%F0%9F%8C%8D,Željka 🌍"})
    void decodesNamesWithCorrectUtf8ResponseLength(String encoded, String decoded) throws Exception {
        assertText(request("GET", "/hello?name=" + encoded), 200, "Hello, " + decoded + "!\n");
    }

    @Test
    void permitsEightyUnicodeCodePointsRatherThanEightyUtf16Units() throws Exception {
        String name = "😀".repeat(80);
        assertText(request("GET", "/hello?name=" + URLEncoder.encode(name, StandardCharsets.UTF_8)),
                200, "Hello, " + name + "!\n");
    }

    @Test
    void ignoresWellFormedUnrelatedParametersAndDecodesParameterNames() throws Exception {
        assertText(request("GET", "/hello?other=Ada&na%6De=Ana+Maria&more=a%26b%3Dc"),
                200, "Hello, Ana Maria!\n");
    }

    @ParameterizedTest
    @ValueSource(strings = {"name=", "name=+++", "name=%09", "name=Ada&name=Bob",
            "name=Ada&na%6De=Bob", "name=%FF", "name=%C3%28", "name=%F0%9F",
            "other=%FF&name=Ada"})
    void rejectsInvalidNamesAndDecodingFailuresAcceptedByUri(String query) throws Exception {
        assertText(request("GET", "/hello?" + query), 400, "Bad request\n");
    }

    @Test
    void rejectsNamesLongerThanEightyCodePoints() throws Exception {
        assertText(request("GET", "/hello?name=" + "a".repeat(81)), 400, "Bad request\n");
        assertText(request("GET", "/hello?name="
                        + URLEncoder.encode("😀".repeat(81), StandardCharsets.UTF_8)),
                400, "Bad request\n");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/health/extra", "/unknown", "/hello/", "/HEALTH"})
    void unknownPathsDoNotMatchContextPrefixes(String path) throws Exception {
        HttpResponse<byte[]> response = request("GET", path);
        assertText(response, 404, "Not found\n");
        assertTrue(response.headers().allValues("Allow").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/health", "/hello"})
    void unsupportedMethodOnKnownPathReturnsAllow(String path) throws Exception {
        HttpResponse<byte[]> response = request("POST", path);
        assertText(response, 405, "Method not allowed\n");
        assertEquals("GET", response.headers().firstValue("Allow").orElseThrow());
    }

    @Test
    void unknownPathStillReturns404ForUnsupportedMethod() throws Exception {
        assertText(request("POST", "/unknown"), 404, "Not found\n");
    }

    @ParameterizedTest
    @CsvSource({"/health,405", "/hello,405", "/unknown,404"})
    void headErrorsHaveNoBody(String path, int status) throws Exception {
        HttpResponse<byte[]> response = request("HEAD", path);
        assertEquals(status, response.statusCode());
        assertEquals(0, response.body().length);
        assertEquals("text/plain; charset=utf-8",
                response.headers().firstValue("Content-Type").orElseThrow());
        if (status == 405) {
            assertEquals("GET", response.headers().firstValue("Allow").orElseThrow());
        }
    }
}
