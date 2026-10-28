#!/usr/bin/env python3
"""Rebuild real Optional demos, then observe execution or check fixed RESULT lines."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def decode_output(value):
    return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else (value or "")


def execute(command, timeout):
    try:
        process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                 encoding="utf-8", timeout=timeout)
        return {"command": command, "exit_code": process.returncode,
                "stdout": process.stdout, "stderr": process.stderr}
    except subprocess.TimeoutExpired as failure:
        return {"command": command, "exit_code": None, "stdout": decode_output(failure.stdout),
                "stderr": decode_output(failure.stderr), "error": "timeout"}
    except OSError as failure:
        return {"command": command, "exit_code": None, "stdout": "",
                "stderr": str(failure), "error": "launch failed"}


def result_lines(stdout):
    return [line for line in stdout.splitlines() if line.startswith("RESULT ")]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cases", nargs="*", help="case01..case10, or hello")
    parser.add_argument("--all", action="store_true", help="select every implemented root case")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--observe", action="store_true", help="run without opening expected files")
    mode.add_argument("--check", action="store_true", help="compare RESULT lines with fixed expected files")
    parser.add_argument("--tests", action="store_true", help="clean verify; requires --all --check")
    args = parser.parse_args()
    if args.tests and not (args.all and args.check):
        parser.error("--tests requires --all --check")

    packages = {}
    for file in sorted((ROOT / "src/main/java/edu/algebra/optional").glob("case*/Main.java")):
        match = re.fullmatch(r"(case\d{2})[a-z]+", file.parent.name)
        if not match:
            continue
        if match[1] in packages:
            parser.error("duplicate case ID in source packages")
        packages[match[1]] = "edu.algebra.optional." + file.parent.name
    selected = sorted(packages) if args.all else args.cases
    if not selected:
        parser.error("select a case, or implement cases before --all")
    if any(not re.fullmatch(r"case\d{2}|hello", case) for case in selected):
        parser.error("invalid case ID")
    for case in selected:
        if case != "hello" and case not in packages:
            parser.error("case package is not implemented: " + case)
        if args.check and not (ROOT / "expected" / (case + ".txt")).is_file():
            parser.error("missing expected results for " + case)

    wrapper = ["cmd", "/c", str(ROOT / "mvnw.cmd")] if os.name == "nt" else [str(ROOT / "mvnw")]
    command = wrapper + (["-q", "clean", "verify"] if args.tests
                         else ["-q", "clean", "package", "-DskipTests"])
    build = execute(command, 120)
    report = {"project": str(ROOT), "mode": "check" if args.check else "observe",
              "build": build, "cases": [], "execution_ok": False, "checks_passed": None}
    if build["exit_code"] != 0:
        print(json.dumps(report, indent=2))
        return 1  # A failed current build must never launch a stale JAR.
    java_home = os.environ.get("JAVA_HOME")
    java = str(Path(java_home) / "bin" / ("java.exe" if os.name == "nt" else "java")) if java_home else shutil.which("java")
    if not java or not (ROOT / "target/optional-lab.jar").is_file():
        report["error"] = "java executable or packaged JAR missing"
        print(json.dumps(report, indent=2))
        return 1

    executed_ok, comparisons_ok = True, True
    for case in selected:
        run = execute([java, "-jar", str(ROOT / "target/optional-lab.jar"), case], 5)
        observation_ok = run["exit_code"] == 0 and run["stderr"] == ""
        actual_lines = result_lines(run["stdout"])
        entry = {"case": case, **run, "result_lines": actual_lines, "execution_ok": observation_ok}
        executed_ok = executed_ok and observation_ok
        if args.check:
            expected_lines = (ROOT / "expected" / (case + ".txt")).read_text(encoding="utf-8").splitlines()
            valid_fixture = bool(expected_lines) and all(line.startswith("RESULT ") for line in expected_lines)
            matches = valid_fixture and actual_lines == expected_lines
            entry["comparison"] = {"expected_result_lines": expected_lines,
                                   "fixture_valid": valid_fixture, "matches": matches}
            comparisons_ok = comparisons_ok and matches
        report["cases"].append(entry)

    unit_ok = True
    if args.tests:
        counts = {"tests": 0, "failures": 0, "errors": 0, "skipped": 0}
        tested_classes = set()
        try:
            for file in (ROOT / "target/surefire-reports").glob("TEST-*.xml"):
                suite = ET.parse(file).getroot()
                for key in counts:
                    counts[key] += int(suite.attrib.get(key, 0))
                tested_classes.update(test.attrib.get("classname", "") for test in suite.iter("testcase"))
            missing = [package for package in packages.values()
                       if not any(name.startswith(package + ".") for name in tested_classes)]
            report["unit_tests"] = {**counts, "packages_without_tests": missing}
            unit_ok = counts["tests"] > 0 and counts["failures"] == counts["errors"] == counts["skipped"] == 0 and not missing
        except (ET.ParseError, ValueError, OSError) as failure:
            report["unit_tests"] = {"error": str(failure)}
            unit_ok = False
    report["execution_ok"] = executed_ok
    if args.check:
        report["checks_passed"] = executed_ok and comparisons_ok and unit_ok
    print(json.dumps(report, indent=2))
    return 0 if executed_ok and (not args.check or (comparisons_ok and unit_ok)) else 1


if __name__ == "__main__":
    sys.exit(main())
