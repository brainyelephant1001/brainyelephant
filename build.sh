#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
BT="${ANDROID_BUILD_TOOLS:-$PWD/tools/build-tools/android-15}"
PLATFORM="${ANDROID_PLATFORM:-$PWD/tools/platform/android-35}"
mkdir -p build/classes build/dex dist
"$BT/aapt2" compile --dir app/src/main/res -o build/resources.zip
"$BT/aapt2" link -o build/unsigned.apk -I "$PLATFORM/android.jar" --manifest app/src/main/AndroidManifest.xml -A app/src/main/assets build/resources.zip
java -jar tools/ecj.jar -1.8 -proc:none -bootclasspath "$PLATFORM/android.jar" -d build/classes app/src/main/java/com/brainyelephant/lightyears/MainActivity.java
python3 -c 'import shutil; shutil.make_archive("build/classes","zip","build/classes")'
mv build/classes.zip build/classes.jar
"$BT/d8" --min-api 23 --lib "$PLATFORM/android.jar" --output build/dex build/classes.jar
cp build/unsigned.apk build/un-aligned.apk
(cd build/dex && zip -q ../un-aligned.apk classes.dex)
"$BT/zipalign" -f 4 build/un-aligned.apk build/aligned.apk
if [ ! -f test-signing.jks ]; then
 keytool -genkeypair -keystore test-signing.jks -storepass android -keypass android -alias lyl-test -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Brainy Elephant Test Build' >/dev/null 2>&1
fi
"$BT/apksigner" sign --ks test-signing.jks --ks-key-alias lyl-test --ks-pass pass:android --key-pass pass:android --out dist/Light-Years-Learning-1.0.0.apk build/aligned.apk
"$BT/apksigner" verify --verbose dist/Light-Years-Learning-1.0.0.apk
"$BT/aapt2" dump badging dist/Light-Years-Learning-1.0.0.apk
