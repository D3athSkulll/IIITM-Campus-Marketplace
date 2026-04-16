#!/usr/bin/env node
/**
 * Non-interactive TWA APK builder using @bubblewrap/core directly.
 * Bypasses interactive CLI prompts. Generates project from existing twa-manifest.json.
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const corePath = path.join(
  "C:/nvm4w/nodejs/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib"
);

const { TwaManifest } = require(path.join(corePath, "TwaManifest"));
const { TwaGenerator } = require(path.join(corePath, "TwaGenerator"));
const { Config } = require(path.join(corePath, "Config"));
const { JdkHelper } = require(path.join(corePath, "jdk/JdkHelper"));
const { AndroidSdkTools } = require(path.join(corePath, "androidSdk/AndroidSdkTools"));
const { GradleWrapper } = require(path.join(corePath, "GradleWrapper"));
const { ConsoleLog } = require(path.join(corePath, "Log"));

const projectDir = __dirname;
const manifestFile = path.join(projectDir, "twa-manifest.json");
const keystorePath = path.join(projectDir, "campus-marketplace-keystore.jks");
const KEYSTORE_PASS = "campus123";
const KEY_ALIAS = "campus-marketplace";

async function main() {
  const log = new ConsoleLog("build-apk");

  console.log("Loading TWA manifest from:", manifestFile);
  const twaManifest = await TwaManifest.fromFile(manifestFile);

  const validationErr = twaManifest.validate();
  if (validationErr) {
    console.error("Manifest validation failed:", validationErr);
    process.exit(1);
  }

  console.log("Package ID:", twaManifest.packageId);
  console.log("Host:", twaManifest.host);

  // Generate keystore if it doesn't exist
  if (!fs.existsSync(keystorePath)) {
    console.log("\n=== Generating keystore ===");
    const jdkPath = "C:\\Users\\mishr\\.bubblewrap\\jdk\\jdk-17.0.18+8";
    const keytoolPath = path.join(jdkPath, "bin", "keytool.exe");
    const result = spawnSync(keytoolPath, [
      "-genkeypair",
      "-v",
      "-keystore", keystorePath,
      "-alias", KEY_ALIAS,
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-storepass", KEYSTORE_PASS,
      "-keypass", KEYSTORE_PASS,
      "-dname", "CN=Campus Marketplace, OU=IIITM, O=IIITM Gwalior, L=Gwalior, S=MP, C=IN",
    ], { stdio: "inherit" });
    if (result.status !== 0) {
      console.error("Failed to generate keystore");
      process.exit(1);
    }
    console.log("Keystore generated at:", keystorePath);
  } else {
    console.log("Keystore already exists at:", keystorePath);
  }

  // Generate TWA project files (skip if already generated — avoids network re-fetch of icons)
  const gradleBuildFile = path.join(projectDir, "app", "build.gradle");
  if (!fs.existsSync(gradleBuildFile)) {
    console.log("\n=== Generating TWA project files ===");
    const generator = new TwaGenerator();
    await generator.createTwaProject(projectDir, twaManifest, log);
    console.log("TWA project generated.");
  } else {
    console.log("\nTWA project already generated, skipping.");
  }

  // Build APK with Gradle
  console.log("\n=== Building APK with Gradle ===");
  const config = new Config(
    "C:\\Users\\mishr\\.bubblewrap\\jdk\\jdk-17.0.18+8",
    "C:\\Users\\mishr\\.bubblewrap\\android_sdk"
  );
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);

  const env = androidSdkTools.getEnv();
  const gradlewPath = path.join(projectDir, "gradlew.bat");
  const gradleResult = spawnSync(`"${gradlewPath}"`, ["assembleRelease", "--stacktrace"], {
    cwd: projectDir,
    env,
    stdio: "inherit",
    shell: true,
  });
  if (gradleResult.status !== 0) {
    console.error("\nGradle build failed with exit code:", gradleResult.status);
    if (gradleResult.error) console.error("Spawn error:", gradleResult.error);
    process.exit(1);
  }
  console.log("\n=== Release APK assembled ===");

  // Sign the APK
  const unsignedApk = path.join(projectDir, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
  const alignedApk = path.join(projectDir, "app-release-aligned.apk");
  const signedApk = path.join(projectDir, "app-release-signed.apk");

  if (!fs.existsSync(unsignedApk)) {
    console.error("Unsigned APK not found at:", unsignedApk);
    process.exit(1);
  }

  console.log("\n=== Zipaligning APK ===");
  await androidSdkTools.zipalign(unsignedApk, alignedApk);

  console.log("\n=== Signing APK ===");
  await androidSdkTools.apksigner(keystorePath, KEYSTORE_PASS, KEY_ALIAS, KEYSTORE_PASS, alignedApk, signedApk);

  console.log("\n========================================");
  console.log("SUCCESS! Signed APK ready at:");
  console.log(signedApk);
  console.log("========================================");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
