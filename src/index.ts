// @ts-ignore
import androidFastfileContent from "../modules/android/Fastfile";

// @ts-ignore
import androidAppfileContent from "../modules/android/Appfile";

// @ts-ignore
import iosFastfileContent from "../modules/ios/Fastfile";

// @ts-ignore
import iosAppfileContent from "../modules/ios/Appfile";

// @ts-ignore
import exportOptionsContent from "../modules/ios/ExportOptions.plist";

// @ts-ignore
import matchFileContent from "../modules/ios/Matchfile";

import { getInput, setFailed, setOutput } from "@actions/core";
import { exec } from "@actions/exec";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Pubspec } from "./components/pubspec";
import { nanoid } from "nanoid";
import { Fastlane } from "./components/fastlane";
import localeCode from "locale-code";

function isValidLanguageRegion(langCode: string) {
  const [lang, region] = langCode.split('-');

  // iso 639 language + iso 3166 country
  return localeCode.getLanguageNativeName(lang) !== undefined &&
         localeCode.getCountryCode(region) !== undefined;
}

(async () => {
    // GitHub Actions inputs
    const appId = getInput("app-id");
    const versionName = getInput("version-name");
    const buildNumber = getInput("build-number");
    const releaseNote = getInput("release-note") || "";
    const releaseNoteLanguage = getInput("release-note-language") || "en-US";
    const matchRepository = getInput("match-repository");
    const matchPassword = getInput("match-password");
    const matchKeychainPassword = getInput("match-keychain-password") || nanoid(10);
    const appstoreConnectIssuerId = getInput("appstore-connect-issuer-id");
    const appstoreConnectKeyId = getInput("appstore-connect-key-id");
    const appstoreConnectKey = getInput("appstore-connect-key");
    const appstoreTeamId = getInput("appstore-team-id");
    const serviceAccountPath = getInput("service-account-path") || "./app/service-account.json";
    const serviceAccountJson = getInput("service-account-json");
    const skipWaitProcessing = getInput("skip-wait-processing") || "true";
    const flutterDir = getInput("flutter-dir") || "./";
    const androidDir = getInput("android-dir") || "./android";
    const iosDir = getInput("ios-dir") || "./ios";
    const buildExtra = getInput("build-extra") || null;
    const aabDestPath = getInput("aab-dest-path") || "./build/release.aab";
    const ipaDestPath = getInput("ipa-dest-path") || "./build/release.ipa";
    const draft = getInput("draft") || "false";

    // Main github action workspace absolute path.
    const workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();

    // Flutter project absolute path.
    const pubspecDir = join(workspaceDir, flutterDir);

    // The bundle identifier for Android (defaults to appId)
    let androidAppId = getInput("android-app-id") || appId;

    // The bundle identifier for iOS (defaults to appId)
    let iosAppId = getInput("ios-app-id") || appId;

    // Replace '-' with '_' to match Android app ID format convention.
    if (androidAppId.includes("-")) {
        const oldAppId = androidAppId;
        const newAppId = androidAppId.replaceAll("-", "_");
        androidAppId = newAppId;
        console.log(`Warning: Android app ID contained '-' and was converted to '${newAppId}' (original: '${oldAppId}')`);
    }

    // Replace '_' with '-' to match iOS app ID format convention.
    if (iosAppId.includes("_")) {
        const oldAppId = iosAppId;
        const newAppId = iosAppId = iosAppId.replaceAll("_", "-");
        iosAppId = newAppId;
        console.log(`Warning: iOS app ID contained '_' and was converted to '${iosAppId}' (original: '${oldAppId}')`);
    }

    // If Android app bundle ID is not provided, attempt to infer
    // it based on the typical Flutter project structure.
    if (androidAppId == "") {
        const target = join(pubspecDir, androidDir, "app", "build.gradle.kts");
        const buffer = readFileSync(target).toString();
        const result = /(?<=applicationId\s*=\s*")[\w.]+(?=")/g.exec(buffer);

        if (result?.length == 1) {
            androidAppId = result[0];
        } else {
            throw new Error(
                "Android Application ID not found.\n" +
                "(💡 You can either provide 'app-id' or both 'android-app-id' and 'ios-app-id' in GitHub Action inputs.)"
            );
        }
    }

    // If iOS bundle ID is not provided, attempt to infer
    // it based on the typical Flutter project structure.
    if (iosAppId == "") {
        const target = join(pubspecDir, iosDir, "Runner.xcodeproj", "project.pbxproj");
        const buffer = readFileSync(target).toString();
        const matches = [...buffer.matchAll(/(?<=PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"?)[\w.-]+(?=\"?;)/g)];

        if (matches.length > 0) {
            iosAppId = matches
                .map(m => m[0])
                .find(v => !v.includes("RunnerTests") && !v.includes("UITests")) || "";
        }

        if (iosAppId == "") {
            throw new Error(
                "iOS Bundle Identifier not found.\n" +
                "(💡 You can either provide 'app-id' or both 'android-app-id' and 'ios-app-id' in GitHub Action inputs.)"
            );
        }
    }

    // Validate the language-region format (e.g., "ko-KR", "en-US")
    // Ensures the release note language follows the ISO 639-1 + ISO 3166-1 alpha-2 standard.
    if (!isValidLanguageRegion(releaseNoteLanguage)) {
        throw new Error(`Invalid language format: '${releaseNoteLanguage}'. Expected format like "en-US" or "ko-KR".`);
    }

    const pubspecPath = join(pubspecDir, "pubspec.yaml");
    const pubspecName = Pubspec.parse(pubspecPath).name;

    console.log("\n🐦 Build And Deploy Information");
    console.log("───────────────────────────────────────────────────");
    console.log(`App Name       : ${pubspecName}`);
    console.log(`Version Name   : ${versionName}`);
    console.log(`Build Number   : ${buildNumber}`);
    console.log(`Android App ID : ${androidAppId}`);
    console.log(`iOS App ID     : ${iosAppId}`);
    console.log("───────────────────────────────────────────────────\n");

    // Determine the full path for the Google service account
    // JSON file based on the provided directory input.
    const serviceAccountFullPath = join(pubspecDir, androidDir, serviceAccountPath);

    // If a JSON string is provided via input, write it to the file.
    // Otherwise, ensure the file exists at the expected location,
    // or provide guidance on how to resolve the missing file issue.
    if (serviceAccountJson.trim() !== "") {
        console.log("📄 Adding the given Google service account JSON file for the Play Store.");

        // In GitHub Actions, inputs must always be provided in Base64 format.
        const decodedBase64 = Buffer.from(serviceAccountJson, "base64").toString("utf-8");

        writeFileSync(serviceAccountFullPath, decodedBase64);
    } else {
        const isExists = existsSync(serviceAccountFullPath);
        if (!isExists) {
            const solutions = [
                `Provide it via 'service-account-json' input`,
                `Place the Google service account JSON file at '${serviceAccountFullPath}'`,
                `Or specify a different directory using 'service-account-dir' input and place the JSON file there`
            ];

            throw new Error(
                `Google service account JSON not found.\nPossible solutions:\n- ${solutions.join("\n- ")}`
            );
        }
    }

    // Attempt to accept Android license.
    try {
        console.log("🛠️ Accepting Android licenses...");
        await exec("bash", ["-c", "yes | flutter doctor --android-licenses"]);
    } catch (error) {
        console.error("Failed to accept Android licenses:", error);
    }

    // Install Fastlane using Homebrew for iOS/Android deployment tasks.
    await exec("brew install fastlane");

    // Install dependencies for Flutter.
    await exec("flutter pub get");

    console.log("📄 Adding the fastlane folder in the android directory.");
    mkdirSync(join(pubspecDir, androidDir, "fastlane"), {recursive: true});

    console.log("📄 Adding Fastfile in the android directory.");
    writeFileSync(join(pubspecDir, androidDir, "fastlane", "Fastfile"), androidFastfileContent)

    console.log("📄 Adding Appfile in the android directory.");
    writeFileSync(
        join(pubspecDir, androidDir, "fastlane", "Appfile"),
        (androidAppfileContent as string)
            .replace("{service-account-path}", serviceAccountPath)
            .replace("{app-bundle-id}", androidAppId)
    );

    console.log("📄 Adding the fastlane folder in the ios directory.");
    mkdirSync(join(pubspecDir, iosDir, "fastlane"), {recursive: true});

    console.log("📄 Adding Fastfile in the ios directory.");
    writeFileSync(join(pubspecDir, iosDir, "fastlane", "Fastfile"), iosFastfileContent);

    console.log("📄 Adding Appfile in the ios directory.");
    writeFileSync(
        join(pubspecDir, iosDir, "fastlane", "Appfile"),
        (iosAppfileContent as string)
            .replace("{app-bundle-id}", iosAppId)
    );

    console.log("📄 Adding Matchfile in the ios directory.");
    writeFileSync(
        join(pubspecDir, iosDir, "fastlane", "Matchfile"),
        (matchFileContent as string)
            .replace("{app-bundle-id}", iosAppId)
            .replace("{match-repository}", matchRepository)
    );

    console.log("📄 Adding ExportOptions.plist in the ios directory.");
    writeFileSync(join(pubspecDir, iosDir, "fastlane", "ExportOptions.plist"), exportOptionsContent);

    const requiredOptions: Record<string, string | number> = {
        version_name: versionName,
        build_number: buildNumber,
        release_note: releaseNote,
        release_note_language: releaseNoteLanguage,
        ...(buildExtra ? { build_extra: buildExtra } : {}),
    };

    console.log("📦 Executing Fastlane lane 'deploy' for Android build...");
    await Fastlane.run(
        join(pubspecDir, androidDir, "fastlane"),
        "android",
        "deploy",
        {
            ...requiredOptions,
            "draft": draft,
            "build_dest_path": aabDestPath,
        },
    );

    console.log("📦 Executing Fastlane lane 'deploy' for iOS build...");
    await Fastlane.run(
        join(pubspecDir, iosDir, "fastlane"),
        "ios",
        "deploy",
        {
            ...requiredOptions,
            "pubspec_name": pubspecName,
            "build_dest_path": ipaDestPath,
            "match_keychain_password": matchKeychainPassword,
            "skip_wait_processing": skipWaitProcessing,
            "bundle_identifier": iosAppId,
            "appstore_team_id": appstoreTeamId,
        },
        { // ENV
            "APPSTORE_CONNECT_ISSUER_ID": appstoreConnectIssuerId,
            "APPSTORE_CONNECT_KEY_ID": appstoreConnectKeyId,
            "APPSTORE_CONNECT_KEY": appstoreConnectKey,
            "MATCH_PASSWORD": matchPassword,
        },
    );

    console.log("🚀 All platform builds have been deployed successfully.");

    // Notify that the upload has been completed, but the new build
    // may take some time to appear on App Store or TestFlight.
    if (Boolean(skipWaitProcessing)) {
        console.log(
            "The deployment has been completed, but it may take some time " +
            "for the new version to appear on the App Store or TestFlight."
        );
    }

    setOutput("success", true);
})().catch(error => {
    console.log(error);
    setFailed("Deployment failed.");
});
