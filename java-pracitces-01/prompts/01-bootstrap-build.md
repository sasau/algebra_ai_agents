Use java-tutor. Build an executable Java 21 Maven project here; stop after packaging.
Preserve the lesson kit and copy the wrapper from resources/maven-wrapper/.
Use artifact/finalName optional-lab, UTF-8 and release21; no runtime or JUnit dependency.
Pin compiler-plugin3.13.0 and jar-plugin3.4.2; explain what the plugins do.
Set Main-Class to edu.algebra.optional.app.Main and create its command router.
Add hello: print a short explanation, then RESULT hello=Optional lab is ready.
Start with an empty --list command; unknown/missing arguments exit with code2.
Give a small plan, create files, then run ./mvnw -q clean package -DskipTests.
Do not launch java -jar or read expected/reference code yet. Report main as NOT RUN.
