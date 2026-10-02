plugins {
    application
}

repositories {
    mavenCentral()
}

// Versions are pinned exactly, never with a `+` or a dynamic range.
// A build that resolves a different version tomorrow than it did today is a
// build that can break for the whole class mid-lab. Bump these deliberately.
dependencies {
    implementation("com.anthropic:anthropic-java:2.64.0")
    implementation("io.github.cdimascio:dotenv-java:3.2.0")
    // The model's tool calls arrive as JSON; the loop turns them into plain
    // Maps with a Jackson TypeReference. Jackson already arrives with the SDK,
    // but depend on it explicitly: code that relies on somebody else's
    // transitive dependency breaks when they drop it.
    implementation("com.fasterxml.jackson.core:jackson-databind:2.19.4")

    // The tool jail (Tools.java) is tested WITHOUT the API — no key needed.
    // JUnit 5; the launcher must be declared explicitly since Gradle 9.
    testImplementation("org.junit.jupiter:junit-jupiter:5.12.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.12.2")
}

java {
    toolchain {
        // Gradle downloads a matching JDK if yours is a different version,
        // so everyone compiles against the same thing.
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// Two main classes. `-Pex=…` picks one:
//
//     ./gradlew run -Pex=check    ->  lab.CheckSetup
//     ./gradlew run -Pex=agent    ->  lab.Ex01AgentLoop
//
// The named tasks at the bottom do the same thing and are easier to remember:
//
//     ./gradlew checkSetup
//     ./gradlew agent
//     ./gradlew agent -PmaxSteps=3     (watch the budget half of the stopping
//                                       condition fire before the test is green)
val mains = mapOf(
    "check" to "lab.CheckSetup",
    "agent" to "lab.Ex01AgentLoop",
)

val requested: String = (project.findProperty("ex") as String?) ?: "check"

application {
    mainClass = mains[requested]
        ?: error("Unknown -Pex=$requested. Use one of: ${mains.keys.joinToString(", ")}")
}

tasks.named<JavaExec>("run") {
    standardInput = System.`in`
    // Keep the lab's own output legible instead of interleaved with Gradle's.
    outputs.upToDateWhen { false }
    // CheckSetup exits 1 on purpose when a check fails. Without this, Gradle
    // buries the lab's own "1 check(s) failed" message under a BUILD FAILED
    // stack trace, and students debug Gradle instead of their environment.
    isIgnoreExitValue = true
}

// Named aliases: ./gradlew agent  ==  ./gradlew run -Pex=agent
mains.forEach { (key, main) ->
    val taskName = when (key) {
        "check" -> "checkSetup"
        else -> key
    }
    tasks.register<JavaExec>(taskName) {
        group = "practice"
        description = "Run $main"
        classpath = sourceSets["main"].runtimeClasspath
        mainClass = main
        standardInput = System.`in`
        outputs.upToDateWhen { false }
        isIgnoreExitValue = true // see the `run` task above
        if (key == "agent") {
            // `-PmaxSteps=N` overrides Client.MAX_STEPS for one run. It is
            // handed to the program as `--max-steps N`, the same flag the
            // TypeScript twin takes (`npm run agent -- --max-steps N`).
            (project.findProperty("maxSteps") as String?)?.let { args("--max-steps", it) }
        }
    }
}

tasks.test {
    useJUnitPlatform()
    // Print each test's verdict, so a red jail test is visible without
    // opening the HTML report.
    testLogging {
        events("passed", "failed", "skipped")
    }
}
