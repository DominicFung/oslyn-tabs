const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

// Play requires API 36 as of 31 Aug 2026. AGP 8.9.1 is the first stable
// plugin that can compile against that SDK, and it needs Gradle 8.11.1+.
const ANDROID_GRADLE_PLUGIN = "8.9.1";
const GRADLE_DISTRIBUTION = "https\\://services.gradle.org/distributions/gradle-8.11.1-all.zip";

const RELEASE_SIGNING_BLOCK = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
def envStoreFile = System.getenv("ANDROID_UPLOAD_STORE_FILE")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
} else if (envStoreFile) {
    keystoreProperties.setProperty("storeFile", envStoreFile)
    keystoreProperties.setProperty("storePassword", System.getenv("ANDROID_UPLOAD_STORE_PASSWORD") ?: "")
    keystoreProperties.setProperty("keyAlias", System.getenv("ANDROID_UPLOAD_KEY_ALIAS") ?: "upload")
    keystoreProperties.setProperty("keyPassword", System.getenv("ANDROID_UPLOAD_KEY_PASSWORD") ?: "")
}

def releaseStorePath = keystoreProperties.getProperty("storeFile")
`;

const SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (releaseStorePath) {
                storeFile rootProject.file(releaseStorePath)
                storePassword keystoreProperties.getProperty("storePassword")
                keyAlias keystoreProperties.getProperty("keyAlias")
                keyPassword keystoreProperties.getProperty("keyPassword")
            }
        }
    }`;

const NAMESPACE_FALLBACK = `
// AGP 8 requires every library module to set a namespace. react-native-linear-gradient
// still only declares its package in AndroidManifest.xml.
subprojects { subproject ->
    subproject.plugins.withId("com.android.library") {
        def androidExt = subproject.extensions.findByName("android")
        if (androidExt != null && androidExt.namespace == null) {
            def manifestFile = subproject.file("src/main/AndroidManifest.xml")
            if (manifestFile.exists()) {
                def packageName = new XmlSlurper().parse(manifestFile).@package.text()
                if (packageName) {
                    androidExt.namespace = packageName
                }
            }
        }
    }
}
`;

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("android/app/build.gradle must stay Groovy so release signing can be configured.");
    }
    let contents = config.modResults.contents;
    if (!contents.includes("keystorePropertiesFile")) {
      contents = contents.replace(
        "def jscFlavor = 'org.webkit:android-jsc:+'",
        `def jscFlavor = 'org.webkit:android-jsc:+'\n${RELEASE_SIGNING_BLOCK}`
      );
    }
    contents = contents.replace(
      /[ \t]*signingConfigs \{[\s\S]*?\n[ \t]*\}\n[ \t]*buildTypes \{/,
      `${SIGNING_CONFIGS}\n    buildTypes {`
    );
    contents = contents.replace(
      /release \{\n\s*\/\/ Caution![\s\S]*?signingConfig signingConfigs\.debug/,
      `release {\n            if (!releaseStorePath) {\n                throw new GradleException("Release signing is not configured. Copy android/keystore.properties.example to android/keystore.properties, or set ANDROID_UPLOAD_STORE_FILE, ANDROID_UPLOAD_STORE_PASSWORD, ANDROID_UPLOAD_KEY_ALIAS, and ANDROID_UPLOAD_KEY_PASSWORD.")\n            }\n            signingConfig signingConfigs.release`
    );
    config.modResults.contents = contents;
    return config;
  });
}

function withPlayGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("android/build.gradle must stay Groovy so the Play Gradle settings can be applied.");
    }
    let contents = config.modResults.contents;
    contents = contents.replace(
      /classpath\((['"])com\.android\.tools\.build:gradle(?::[^'"]+)?\1\)/,
      `classpath('com.android.tools.build:gradle:${ANDROID_GRADLE_PLUGIN}')`
    );
    if (!contents.includes("androidExt.namespace")) {
      contents += `\n${NAMESPACE_FALLBACK}`;
    }
    config.modResults.contents = contents;
    return config;
  });
}

function withoutReleaseOverlayPermission(config) {
  return withAndroidManifest(config, (config) => {
    const permissions = config.modResults.manifest["uses-permission"] || [];
    config.modResults.manifest["uses-permission"] = permissions.filter((entry) => {
      return entry.$?.["android:name"] !== "android.permission.SYSTEM_ALERT_WINDOW";
    });
    return config;
  });
}

function withGradleWrapper(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        "gradle/wrapper/gradle-wrapper.properties"
      );
      const contents = fs.readFileSync(wrapperPath, "utf8");
      const next = contents.replace(/distributionUrl=.*/g, `distributionUrl=${GRADLE_DISTRIBUTION}`);
      fs.writeFileSync(wrapperPath, next);
      return config;
    },
  ]);
}

module.exports = function withAndroidPlayRelease(config) {
  config = withPlayGradle(config);
  config = withReleaseSigning(config);
  config = withoutReleaseOverlayPermission(config);
  config = withGradleWrapper(config);
  return config;
};
