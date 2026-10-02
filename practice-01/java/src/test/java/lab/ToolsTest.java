package lab;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * The jail, tested without the API.
 *
 * <p>Rule 2 and the path jail are the harness's guarantees, not the model's
 * promises — so they are the one part of the loop worth a unit test. The
 * target is a throwaway directory, never the real parser project.
 */
class ToolsTest {

    @TempDir
    Path target;

    Tools tools;

    @BeforeEach
    void aTinyFakeProject() throws IOException {
        Files.writeString(target.resolve("package.json"), "{ \"name\": \"throwaway\" }\n");
        Files.createDirectories(target.resolve("src"));
        Files.createDirectories(target.resolve("test"));
        Files.writeString(target.resolve("test/parser.test.ts"), "// do not touch\n");
        tools = new Tools(target);
    }

    @Test
    void readFile_climbingOutWithDotDot_isRefused() {
        Tools.Result r = tools.readFile("../.env");
        assertTrue(r.isError(), "expected an error result, got: " + r.text());
        assertTrue(r.text().startsWith("refused:"), r.text());
    }

    @Test
    void readFile_absolutePath_isRefused() {
        Tools.Result r = tools.readFile("/etc/passwd");
        assertTrue(r.isError(), "expected an error result, got: " + r.text());
        assertTrue(r.text().startsWith("refused:"), r.text());
    }

    @Test
    void writeFile_underTest_isRefusedAndNothingIsWritten() throws IOException {
        Tools.Result r = tools.writeFile("test/x.ts", "export const cheat = true;\n");
        assertTrue(r.isError(), "expected an error result, got: " + r.text());
        assertTrue(r.text().contains("test/"), r.text());
        assertFalse(Files.exists(target.resolve("test/x.ts")), "the file must not be created");
        assertEquals("// do not touch\n", Files.readString(target.resolve("test/parser.test.ts")));
    }

    @Test
    void writeFile_sneakingIntoTestViaDotDot_isRefused() {
        Tools.Result r = tools.writeFile("src/../test/parser.test.ts", "");
        assertTrue(r.isError(), r.text());
    }

    @Test
    void readFile_insideTarget_works() {
        Tools.Result r = tools.readFile("package.json");
        assertFalse(r.isError(), r.text());
        assertEquals("{ \"name\": \"throwaway\" }\n", r.text());
    }

    @Test
    void writeFile_underSrc_works() throws IOException {
        Tools.Result r = tools.writeFile("src/parser.ts", "export {};\n");
        assertFalse(r.isError(), r.text());
        assertEquals("export {};\n", Files.readString(target.resolve("src/parser.ts")));
    }

    @Test
    void dispatch_routesByNameAndReportsUnknownTools() {
        assertFalse(tools.dispatch("read_file", Map.of("path", "package.json")).isError());
        Tools.Result unknown = tools.dispatch("delete_everything", Map.of());
        assertTrue(unknown.isError());
        assertTrue(unknown.text().startsWith("unknown tool"), unknown.text());
    }
}
