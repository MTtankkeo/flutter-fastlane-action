// @ts-ignore
import iosFastfileContent from "../../modules/ios/Fastfile";

// @ts-ignore
import iosAppfileContent from "../../modules/ios/Appfile";

// @ts-ignore
import exportOptionsContent from "../../modules/ios/ExportOptions.plist";

// @ts-ignore
import matchFileContent from "../../modules/ios/Matchfile";

import { join } from "path";
import { Config } from "./config";
import { FastlaneRunner } from "./fastlane_runner";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { Fastlane } from "./fastlane";

/**
 * iOS-specific fastlane runner handling file generation and build execution
 * Implements the shared runner lifecycle for the iOS platform.
 */
export class FastlaneIosRunner extends FastlaneRunner {
    get name(): string {
        return "iOS";
    }

    print(config: Config): void {
        console.log(`iOS App ID     : ${config.iosAppId}`);
    }

    async initialize(config: Config): Promise<void> {
        Config.assertInput("match-repository");
        Config.assertInput("match-password");
        Config.assertInput("appstore-connect-issuer-id");
        Config.assertInput("appstore-connect-key-id");
        Config.assertInput("appstore-connect-key");
        Config.assertInput("appstore-team-id");

        // Replace '_' with '-' to match iOS app ID format convention.
        if (config.iosAppId.includes("_")) {
            const oldAppId = config.iosAppId;
            const newAppId = config.iosAppId = config.iosAppId.replaceAll("_", "-");
            config.iosAppId = newAppId;
            console.log(`Warning: iOS app ID contained '_' and was converted to '${config.iosAppId}' (original: '${oldAppId}')`);
        }
    
        // If iOS bundle ID is not provided, attempt to infer
        // it based on the typical Flutter project structure.
        if (config.iosAppId == "") {
            const target = join(config.pubspecDir, config.iosDir, "Runner.xcodeproj", "project.pbxproj");
            const buffer = readFileSync(target).toString();
            const matches = [...buffer.matchAll(/(?<=PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"?)[\w.-]+(?=\"?;)/g)];
    
            if (matches.length > 0) {
                config.iosAppId = matches
                    .map(m => m[0])
                    .find(v => !v.includes("RunnerTests") && !v.includes("UITests")) || "";
            }
    
            if (config.iosAppId == "") {
                throw new Error(
                    "iOS Bundle Identifier not found.\n" +
                    "(💡 You can either provide 'app-id' or both 'android-app-id' and 'ios-app-id' in GitHub Action inputs.)"
                );
            }
        }
    }

    async ready(config: Config): Promise<void> {
        const pubspecDir = config.pubspecDir;
        const iosDir = config.iosDir;

        console.log("📄 Adding the fastlane folder in the ios directory.");
        mkdirSync(join(pubspecDir, iosDir, "fastlane"), {recursive: true});

        console.log("📄 Adding Fastfile in the ios directory.");
        writeFileSync(join(pubspecDir, iosDir, "fastlane", "Fastfile"), iosFastfileContent);

        console.log("📄 Adding Appfile in the ios directory.");
        writeFileSync(
            join(pubspecDir, iosDir, "fastlane", "Appfile"),
            (iosAppfileContent as string)
                .replace("{app-bundle-id}", config.iosAppId)
        );

        console.log("📄 Adding Matchfile in the ios directory.");
        writeFileSync(
            join(pubspecDir, iosDir, "fastlane", "Matchfile"),
            (matchFileContent as string)
                .replace("{app-bundle-id}", config.iosAppId)
                .replace("{match-repository}", config.matchRepository)
        );

        console.log("📄 Adding ExportOptions.plist in the ios directory.");
        writeFileSync(join(pubspecDir, iosDir, "fastlane", "ExportOptions.plist"), exportOptionsContent);
    }

    async run(config: Config): Promise<void> {
        const pubspecDir = config.pubspecDir;
        const iosDir = config.iosDir;

        if (!config.isMac) {
            throw new Error(`iOS builds can only be run on a macOS runner`);
        }

        await Fastlane.run(
            join(pubspecDir, iosDir, "fastlane"),
            "ios",
            "deploy",
            {
                ...config.baseOptions,
                "pubspec_name": config.pubspecName,
                "build_dest_path": config.ipaDestPath,
                "match_keychain_password": config.matchKeychainPassword,
                "skip_wait_processing": config.skipWaitProcessing,
                "bundle_identifier": config.iosAppId,
                "appstore_team_id": config.appstoreTeamId,
            },
            { // ENV
                "APPSTORE_CONNECT_ISSUER_ID": config.appstoreConnectIssuerId,
                "APPSTORE_CONNECT_KEY_ID": config.appstoreConnectKeyId,
                "APPSTORE_CONNECT_KEY": config.appstoreConnectKey,
                "MATCH_PASSWORD": config.matchPassword,
            },
        );

        // Notify that the upload has been completed, but the new build
        // may take some time to appear on App Store or TestFlight.
        if (Boolean(config.skipWaitProcessing)) {
            console.log(
                "The deployment has been completed, but it may take some time " +
                "for the new version to appear on the App Store or TestFlight."
            );
        }
    }
}
