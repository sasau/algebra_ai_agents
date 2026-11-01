#!/usr/bin/env python3
"""Create a small empty Maven project. Never replace an existing file."""
import argparse
from pathlib import Path
import re

POM = '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>{group}</groupId>
  <artifactId>{artifact}</artifactId>
  <version>1.0-SNAPSHOT</version>
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.12.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-clean-plugin</artifactId><version>3.4.1</version></plugin>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-resources-plugin</artifactId><version>3.3.1</version></plugin>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.0</version></plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.5.3</version>
        <configuration>
          <failIfNoTests>true</failIfNoTests>
          <redirectTestOutputToFile>false</redirectTestOutputToFile>
          <useFile>false</useFile>
          <printSummary>true</printSummary>
          <trimStackTrace>false</trimStackTrace>
          <runOrder>alphabetical</runOrder>
        </configuration>
      </plugin>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-jar-plugin</artifactId><version>3.4.2</version></plugin>
    </plugins>
  </build>
</project>
'''

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target', type=Path)
    parser.add_argument('--group-id', default='edu.algebra')
    parser.add_argument('--artifact-id', default='concurrency-lab')
    parser.add_argument('--package', default='edu.algebra.concurrency')
    args = parser.parse_args()
    for label, value in [('group-id', args.group_id), ('package', args.package)]:
        if not re.fullmatch(r'[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*', value):
            parser.error(f'{label} must be a lower-case Java package name')
    if not re.fullmatch(r'[a-z][a-z0-9-]*', args.artifact_id):
        parser.error('artifact-id must contain lower-case letters, digits or hyphens')
    target = args.target
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        parser.error(f'refusing nonempty or non-directory destination: {target}')
    target.mkdir(parents=True, exist_ok=True)
    (target / 'pom.xml').write_text(POM.format(group=args.group_id, artifact=args.artifact_id), encoding='utf-8')
    (target / '.gitignore').write_text('target/\n', encoding='utf-8')
    (target / 'README.md').write_text('# Empty Java Maven project\n\nJDK 21+ and Maven 3.9+ are required.\n\nRun `mvn -B verify` after adding the first feature and its JUnit tests.\nThe build deliberately fails when no tests exist. Tests print explanations and actual assertion values to the console.\n\nFor the empty scaffold only, `mvn -B -DskipTests package` checks build setup; label it TESTS NOT RUN.\n', encoding='utf-8')
    for kind in ('main', 'test'):
        package = target / 'src' / kind / 'java' / Path(*args.package.split('.'))
        package.mkdir(parents=True)
        (package / '.gitkeep').write_text('', encoding='utf-8')
    print(f'Created empty project: {target.resolve()}')

if __name__ == '__main__':
    main()
