#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p tools
curl -fLsS https://dl.google.com/android/repository/build-tools_r35_linux.zip -o tools/build-tools.zip
curl -fLsS https://dl.google.com/android/repository/platform-35_r02.zip -o tools/platform.zip
curl -fLsS https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.40.0/ecj-3.40.0.jar -o tools/ecj.jar
unzip -q -o tools/build-tools.zip -d tools/build-tools
unzip -q -o tools/platform.zip -d tools/platform
