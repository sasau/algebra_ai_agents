package lab;
import java.nio.file.Path;
import java.util.Map;
/** Calls the supplied tool functions directly. No API client, key or model needed. */
public final class ToolsDemo {
  public static void main(String[] args) throws Exception {
    Path root = Path.of("..").toAbsolutePath().normalize();
    Tools.Exec prepared = Tools.exec(root, "node", "scripts/prepare-run.mjs", "tools-java");
    if (prepared.exit() != 0) throw new IllegalStateException(prepared.output());
    Tools tools = new Tools(Path.of(prepared.output().strip()));
    System.out.println("Run directory: " + tools.target());
    Tools.Result read = tools.dispatch("read_file", Map.of("path", "src/parser.ts"));
    System.out.println("read_file(src/parser.ts): " + (read.isError() ? "ERROR" : "OK"));
    read.text().lines().limit(4).forEach(System.out::println);
    Tools.Result blocked = tools.dispatch("write_file", Map.of("path", "test/parser.test.ts", "content", "// forbidden"));
    System.out.println("write_file(test/parser.test.ts): " + (blocked.isError() ? "REFUSED (expected)" : "ERROR: allowed"));
    Tools.Result config = tools.dispatch("write_file", Map.of("path", "package.json", "content", "{}"));
    System.out.println("write_file(package.json): " + (config.isError() ? "REFUSED (expected)" : "ERROR: allowed"));
    Tools.Result tests = tools.dispatch("run_tests", Map.of());
    System.out.println(tests.text());
    if (read.isError() || !blocked.isError() || !config.isError() || tests.isError() || !tests.text().startsWith("exit code 1\n") || !tests.text().contains("unexpected token WHERE")) System.exit(1);
    System.out.println("DEMO PASSED — tools work; the supplied WHERE test is intentionally red. No model was called.");
  }
}
