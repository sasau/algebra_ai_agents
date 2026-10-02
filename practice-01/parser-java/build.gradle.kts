import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    java
}

repositories {
    mavenCentral()
}

// Versions are pinned exactly, never with a `+` or a dynamic range.
// A build that resolves a different version tomorrow than it did today is a
// build that can break for the whole class mid-lab. Bump these deliberately.
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.11.4")
    // Gradle 9 no longer puts the JUnit Platform launcher on the test runtime
    // classpath for you; without it `./gradlew test` fails before a single test
    // runs. 1.11.4 is the launcher version JUnit 5.11.4's own BOM pins, so the
    // two always move together.
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.11.4")
}

java {
    toolchain {
        // Gradle downloads a matching JDK if yours is a different version,
        // so everyone compiles against the same thing.
        languageVersion = JavaLanguageVersion.of(21)
    }
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        // Gradle's default hides passing tests and truncates stack traces. Here
        // the failure message IS the lab material: every Act 1 row starts by
        // reading it, and the agent rows need the full trace to find the source
        // file. So print every test's result, and the whole exception on failure.
        events("passed", "failed")
        exceptionFormat = TestExceptionFormat.FULL
    }
}
