import { getInput } from "@actions/core";
import { nanoid } from "nanoid";
import * as os from "os";
import { join } from "path";
import { Pubspec } from "./pubspec";

/** Stores all build-related configuration values used across fastlane runners. */
export class Config {
    // Determines if the runner is macOS, required for iOS builds.
    isMac = os.platform() === "darwin";

    // GitHub Actions inputs
    appId = getInput("app-id");
    versionName = getInput("version-name");
    buildNumber = getInput("build-number");
    releaseNote = getInput("release-note") || "";
    releaseNoteLanguage = getInput("release-note-language") || "en-US";
    matchRepository = getInput("match-repository");
    matchPassword = getInput("match-password");
    matchKeychainPassword = getInput("match-keychain-password") || nanoid(10);
    appstoreConnectIssuerId = getInput("appstore-connect-issuer-id");
    appstoreConnectKeyId = getInput("appstore-connect-key-id");
    appstoreConnectKey = getInput("appstore-connect-key");
    appstoreTeamId = getInput("appstore-team-id");
    serviceAccountPath = getInput("service-account-path") || "./app/service-account.json";
    serviceAccountJson = getInput("service-account-json");
    skipWaitProcessing = getInput("skip-wait-processing") || "true";
    flutterDir = getInput("flutter-dir") || "./";
    androidDir = getInput("android-dir") || "./android";
    iosDir = getInput("ios-dir") || "./ios";
    buildExtra = getInput("build-extra") || null;
    aabDestPath = getInput("aab-dest-path") || "./build/release.aab";
    ipaDestPath = getInput("ipa-dest-path") || "./build/release.ipa";
    draft = getInput("draft") || "false";
    platform = getInput("platform") || (this.isMac ? "all" : "android");

    /** Main github action workspace absolute path. */
    workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();

    /** Flutter project absolute path. */
    pubspecDir = join(this.workspaceDir, this.flutterDir);

    /** Bundle identifier for Android (defaults to appId) */
    androidAppId = getInput("android-app-id") || this.appId;

    /** Bundle identifier for iOS (defaults to appId) */
    iosAppId = getInput("ios-app-id") || this.appId;

    /** Absolute path to the project's pubspec.yaml */
    pubspecPath = join(this.pubspecDir, "pubspec.yaml");

    /** Flutter project name parsed from pubspec.yaml */
    pubspecName = Pubspec.parse(this.pubspecPath).name;

    /** Shared fastlane parameters applied to both Android and iOS builds. */
    baseOptions: Record<string, string | number> = {
        version_name: this.versionName,
        build_number: this.buildNumber,
        release_note: this.releaseNote,
        release_note_language: this.releaseNoteLanguage,
        ...(this.buildExtra ? { build_extra: this.buildExtra } : {}),
    };

    /** Asserts that the specified input exists and is not empty. */
    static assertInput(name: string): void {
        const value = getInput(name).trim();
        if (!value) {
            throw new Error(`Missing required value for input: ${name}`);
        }
    }
}
