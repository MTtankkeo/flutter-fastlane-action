import localeCode from "locale-code";
import { setFailed, setOutput } from "@actions/core";
import { exec } from "@actions/exec";
import { Config } from "./components/config";
import { FastlaneRunner } from "./components/fastlane_runner";
import { FastlaneAndroidRunner } from "./components/fastlane_android_runner";
import { FastlaneIosRunner } from "./components/fastlane_ios_runner";

function isValidLanguageRegion(langCode: string) {
  const [lang, region] = langCode.split('-');

  // iso 639 language + iso 3166 country
  return localeCode.getLanguageNativeName(lang) !== undefined &&
         localeCode.getCountryCode(region) !== undefined;
}

(async () => {
    const config = new Config();
    const runners: FastlaneRunner[] = [];

    // Determines which platform builds should run.
    const shouldAndroid = config.platform == "all" || config.platform == "android";
    const shouldIos = config.platform == "all" || config.platform == "ios";

    // Adds the Android fastlane runner when the Android build is enabled.
    if (shouldAndroid) {
        runners.push(new FastlaneAndroidRunner());
    }

    // Adds the iOS fastlane runner when the iOS build is enabled.
    if (shouldIos) {
        runners.push(new FastlaneIosRunner());
    }

    for (const runner of runners) {
        await runner.initialize(config);
    }

    // Validate the language-region format (e.g., "ko-KR", "en-US")
    // Ensures the release note language follows the ISO 639-1 + ISO 3166-1 alpha-2 standard.
    if (!isValidLanguageRegion(config.releaseNoteLanguage)) {
        throw new Error(`Invalid language format: '${config.releaseNoteLanguage}'. Expected format like "en-US" or "ko-KR".`);
    }

    console.log("\n🐦 Build And Deploy Information");
    console.log("───────────────────────────────────────────────────");
    console.log(`App Name       : ${config.pubspecName}`);
    console.log(`Version Name   : ${config.versionName}`);
    console.log(`Build Number   : ${config.buildNumber}`);
    runners.forEach(runner => runner.print(config));
    console.log("───────────────────────────────────────────────────\n");

    for (const runner of runners) {
        await runner.ready(config);
    }

    // Install dependencies for Flutter.
    await exec("flutter pub get");

    // Install Fastlane using Homebrew or RubyGems for iOS/Android deployment tasks.
    if (config.isMac) {
        console.log("Installing Fastlane via Homebrew...");
        await exec("brew install fastlane");
    } else {
        console.log("Installing Fastlane via RubyGems...");
        await exec("sudo gem install fastlane -NV");
    }

    for (const runner of runners) {
        console.log(`📦 Executing Fastlane lane 'deploy' for ${runner.name} build...`);
        await runner.run(config);
    }

    console.log("🚀 All platform builds have been deployed successfully.");

    setOutput("success", true);
})().catch(error => {
    console.log(error);
    setFailed("Deployment failed.");
});
