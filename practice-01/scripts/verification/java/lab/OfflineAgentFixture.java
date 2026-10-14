package lab;

import com.anthropic.client.AnthropicClient;
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.*;
import com.anthropic.services.blocking.MessageService;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/** Test-only SDK fake. No real client is built and no network request is made. */
public final class OfflineAgentFixture {
    private static String scenario;
    private static int calls;
    private static final List<String> expectedIds = new ArrayList<>();
    private static final List<Boolean> expectedErrors = new ArrayList<>();
    private static final List<String> expectedMarkers = new ArrayList<>();

    private static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError("fixture assertion: " + message);
    }

    private static ContentBlock tool(String name, Map<String, Object> input, boolean error, String marker) {
        String id = "fixture_" + calls + "_" + expectedIds.size();
        expectedIds.add(id); expectedErrors.add(error); expectedMarkers.add(marker);
        return ContentBlock.ofToolUse(ToolUseBlock.builder().id(id).name(name).input(JsonValue.from(input)).caller(DirectCaller.builder().build()).toolsetName(Optional.empty()).build());
    }

    private static Message respond(MessageCreateParams params) throws Exception {
        calls++;
        require(params.model().asString().equals(Client.MODEL), "model must stay pinned");
        if (scenario.equals("setup")) {
            require(calls == 1 && params.maxTokens() == 5, "setup uses exactly one tiny call");
            return message(List.of(ContentBlock.ofText(TextBlock.builder().text("OK").citations(List.of()).build())), StopReason.END_TURN);
        }
        require(params.messages().size() == 1 + 2 * (calls - 1), "history must grow by assistant plus results");
        require(params.tools().orElseThrow().size() == 3, "three tool schemas must be sent");
        if (calls > 1) {
            var results = params.messages().getLast().content().blockParams().orElseThrow();
            require(results.size() == expectedIds.size(), "one result per tool call");
            var assistant = params.messages().get(params.messages().size() - 2).content().blockParams().orElseThrow();
            require(assistant.size() == expectedIds.size(), "assistant tool blocks retained in history");
            for (int i = 0; i < results.size(); i++) {
                var result = results.get(i).toolResult().orElseThrow();
                require(result.toolUseId().equals(expectedIds.get(i)), "tool ID pairing");
                require(result.isError().orElse(false).equals(expectedErrors.get(i)), "tool error returned to model");
                require(result.content().orElseThrow().asString().contains(expectedMarkers.get(i)), "tool output marker");
            }
        }
        expectedIds.clear(); expectedErrors.clear(); expectedMarkers.clear();
        if (scenario.equals("api-error")) throw new IllegalStateException("offline fixture API unavailable");
        if (scenario.equals("max-tokens")) return message(List.of(), StopReason.MAX_TOKENS);
        if (scenario.equals("false-success")) return message(List.of(ContentBlock.ofText(TextBlock.builder().text("I claim the tests pass.").citations(List.of()).build())), StopReason.END_TURN);
        if (scenario.equals("budget")) return message(List.of(tool("read_file", Map.of("path", "src/parser.ts"), false, "parseSelect")), StopReason.TOOL_USE);
        require(scenario.equals("success"), "known scenario");
        var blocks = new ArrayList<ContentBlock>();
        switch (calls) {
            case 1 -> {
                blocks.add(tool("read_file", Map.of("path", "src/parser.ts"), false, "parseSelect"));
                blocks.add(tool("read_file", Map.of("path", "test/parser.test.ts"), false, "WHERE"));
            }
            case 2 -> {
                blocks.add(tool("write_file", Map.of("path", "test/parser.test.ts", "content", "tamper"), true, "src"));
                blocks.add(tool("write_file", Map.of("path", "package.json", "content", "tamper"), true, "src"));
                blocks.add(tool("unknown_tool", Map.of(), true, "unknown tool"));
            }
            case 3 -> {
                String source = Files.readString(Path.of("../parser-ts/src/parser.ts"));
                String old = "    // The statement ends at the table name; whatever follows is a stray token.\n    this.expect(\"EOF\");\n    return { columns, table };";
                String replacement = "    let where: Comparison | undefined;\n    if (this.peek().type === \"WHERE\") {\n      this.advance();\n      where = this.parseExpression();\n    }\n    this.expect(\"EOF\");\n    return where ? { columns, table, where } : { columns, table };";
                require(source.contains(old), "baseline remains deliberately red");
                blocks.add(tool("write_file", Map.of("path", "src/parser.ts", "content", source.replace(old, replacement)), false, "wrote"));
            }
            case 4 -> blocks.add(tool("run_tests", Map.of(), false, "exit code 0"));
            case 5 -> { return message(List.of(ContentBlock.ofText(TextBlock.builder().text("All supplied tests pass.").citations(List.of()).build())), StopReason.END_TURN); }
            default -> throw new AssertionError("fixture exhausted");
        }
        return message(blocks, StopReason.TOOL_USE);
    }

    private static Message message(List<ContentBlock> content, StopReason reason) {
        return Message.builder().id("msg_fixture_" + calls).content(content).model(Client.MODEL)
                .role(JsonValue.from("assistant")).container(Optional.empty()).stopDetails(Optional.empty()).stopReason(reason).stopSequence(Optional.empty())
                .usage(Usage.builder().inputTokens(100).outputTokens(20).cacheCreation(Optional.empty()).cacheCreationInputTokens(Optional.empty()).cacheReadInputTokens(Optional.empty()).inferenceGeo(Optional.empty()).outputTokensDetails(Optional.empty()).serverToolUse(Optional.empty()).serviceTier(Optional.empty()).build()).build();
    }

    public static void main(String[] args) throws Exception {
        scenario = args[0];
        // A synthetic marker is used only to pass the application's local key check.
        // The fake installed below never sends it anywhere.
        System.setProperty("ANTHROPIC_API_KEY", "sk-ant-offline-fixture-not-a-key");
        var service = (MessageService) Proxy.newProxyInstance(MessageService.class.getClassLoader(), new Class<?>[]{MessageService.class}, (proxy, method, values) -> {
            if (method.getName().equals("create") && values[0] instanceof MessageCreateParams params) return respond(params);
            throw new UnsupportedOperationException("unexpected test service method: " + method.getName());
        });
        var client = (AnthropicClient) Proxy.newProxyInstance(AnthropicClient.class.getClassLoader(), new Class<?>[]{AnthropicClient.class}, (proxy, method, values) -> {
            if (method.getName().equals("messages")) return service;
            throw new UnsupportedOperationException("unexpected test client method: " + method.getName());
        });
        var field = Client.class.getDeclaredField("instance");
        field.setAccessible(true); field.set(null, client);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> System.out.println("FIXTURE_CALLS=" + calls)));
        if (scenario.equals("setup")) CheckSetup.main(new String[]{"--live"});
        else Ex01AgentLoop.main(args.length > 1 ? new String[]{"--max-steps", args[1]} : new String[0]);
    }
}
