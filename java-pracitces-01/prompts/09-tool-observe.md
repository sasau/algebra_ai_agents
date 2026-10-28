Build tools/run_case.py for the repeated mechanical execution procedure.
Use Python standard-library subprocess argument lists; no shell=True.
Accept caseNN/hello or --all; discover only implemented root case*/Main.java packages.
Require --observe mode, rebuild with the Maven Wrapper and launch the real java -jar.
Bound builds at120s and JVM runs at5s. Stop on a failed build; never run a stale JAR.
Capture commands/stdout/stderr/exit code and extract lines starting RESULT .
Print JSON evidence, fail on launch/timeout/process errors and never read expected/.
This mode observes execution; it does not claim behavioural correctness.
Create the tool only. Stop before invoking it.
