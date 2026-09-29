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
    // Exercise 4 parses JSON the model produced. Jackson already arrives with
    // the SDK, but depend on it explicitly: code that relies on somebody
    // else's transitive dependency breaks when they drop it.
    implementation("com.fasterxml.jackson.core:jackson-databind:2.19.4")
}

java {
    toolchain {
        // Gradle downloads a matching JDK if yours is a different version,
        // so everyone compiles against the same thing.
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// Every exercise is its own main class. `-Pex=N` picks one:
//
//     ./gradlew run -Pex=check    ->  lab.CheckSetup
//     ./gradlew run -Pex=1        ->  lab.Ex01FirstCall
//     ./gradlew run -Pex=stream   ->  lab.Ex05StretchStream
//     ./gradlew run -Pex=7        ->  lab.Ex07Models   (three models; ~$0.10–0.30)
//
// The named tasks at the bottom (./gradlew ex1) do the same thing and are
// easier to remember. Use whichever you prefer.
val mains = mapOf(
    "check" to "lab.CheckSetup",
    "1" to "lab.Ex01FirstCall",
    "2" to "lab.Ex02Conversation",
    "3" to "lab.Ex03Knobs",
    "4" to "lab.Ex04Json",
    "7" to "lab.Ex07Models",
    "stream" to "lab.Ex05StretchStream",
    "chat" to "lab.Ex06StretchChat",
)

val requested: String = (project.findProperty("ex") as String?) ?: "check"

application {
    mainClass = mains[requested]
        ?: error("Unknown -Pex=$requested. Use one of: ${mains.keys.joinToString(", ")}")
}

tasks.named<JavaExec>("run") {
    // The chat REPL reads from stdin; without this Gradle hands it an empty
    // stream and the loop exits immediately.
    standardInput = System.`in`
    // Keep the lab's own output legible instead of interleaved with Gradle's.
    outputs.upToDateWhen { false }
    // CheckSetup exits 1 on purpose when a check fails. Without this, Gradle
    // buries the lab's own "1 check(s) failed" message under a BUILD FAILED
    // stack trace, and students debug Gradle instead of their environment.
    isIgnoreExitValue = true
}

// Named aliases: ./gradlew ex1  ==  ./gradlew run -Pex=1
mains.forEach { (key, main) ->
    val taskName = when (key) {
        "check" -> "checkSetup"
        "stream" -> "stretchStream"
        "chat" -> "stretchChat"
        else -> "ex$key"
    }
    tasks.register<JavaExec>(taskName) {
        group = "practice"
        description = "Run $main"
        classpath = sourceSets["main"].runtimeClasspath
        mainClass = main
        standardInput = System.`in`
        isIgnoreExitValue = true // see the `run` task above
    }
}
