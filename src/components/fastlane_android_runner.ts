// @ts-ignore
import androidFastfileContent from "../../modules/android/Fastfile";

// @ts-ignore
import androidAppfileContent from "../../modules/android/Appfile";

import { FastlaneRunner } from "./fastlane_runner";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Config } from "./config";
import { exec } from "@actions/exec";
import { Fastlane } from "./fastlane";

/**
 * Android-specific fastlane runner handling file generation and build execution
 * Implements the shared runner lifecycle for the Android platform.
 */
export class FastlaneAndroidRunner extends FastlaneRunner {
    get name(): string {
        return "Android";
    }

    print(config: Config): void {
        console.log(`Android App ID : ${config.androidAppId}`);
    }

    async initialize(config: Config): Promise<void> {
        const pubspecDir = config.pubspecDir;
        const androidDir = config.androidDir;

        // Replace '-' with '_' to match Android app ID format convention.
        if (config.androidAppId.includes("-")) {
            const oldAppId = config.androidAppId;
            const newAppId = config.androidAppId.replaceAll("-", "_");
            config.androidAppId = newAppId;
            console.log(`Warning: Android app ID contained '-' and was converted to '${newAppId}' (original: '${oldAppId}')`);
        }

        // If Android app bundle ID is not provided, attempt to infer
        // it based on the typical Flutter project structure.
        if (config.androidAppId == "") {
            const gradlePaths = [
                join(pubspecDir, androidDir, "app", "build.gradle.kts"),
                join(pubspecDir, androidDir, "app", "build.gradle"),
            ];

            const target = gradlePaths.find((p) => existsSync(p));
            if (target) {
                const buffer = readFileSync(target).toString();
                const result = /(?<=applicationId\s*=?\s*")[\w.]+(?=")/g.exec(buffer);

                if (result?.length == 1) {
                    config.androidAppId = result[0];
                } else {
                    throw new Error(
                        "Android Application ID not found.\n" +
                        "(💡 You can either provide 'app-id' or both 'android-app-id' and 'ios-app-id' in GitHub Action inputs.)"
                    );
                }
            } else {
                throw new Error(
                    "Android build.gradle not found.\n" +
                    "(💡 You can either provide 'app-id' or both 'android-app-id' and 'ios-app-id' in GitHub Action inputs.)"
                );
            }
        }

        // Determine the full path for the Google service account
        // JSON file based on the provided directory input.
        const serviceAccountFullPath = join(
            pubspecDir,
            androidDir,
            config.serviceAccountPath,
        );

        // If a JSON string is provided via input, write it to the file.
        // Otherwise, ensure the file exists at the expected location,
        // or provide guidance on how to resolve the missing file issue.
        if (config.serviceAccountJson.trim() !== "") {
            console.log("📄 Adding the given Google service account JSON file for the Play Store.");

            // In GitHub Actions, inputs must always be provided in Base64 format.
            const decodedBase64 = Buffer.from(config.serviceAccountJson, "base64").toString("utf-8");

            writeFileSync(serviceAccountFullPath, decodedBase64);
        } else {
            const isExists = existsSync(serviceAccountFullPath);
            if (!isExists) {
                const solutions = [
                    `Provide it via 'service-account-json' input`,
                    `Place the Google service account JSON file at '${serviceAccountFullPath}'`,
                    `Or specify a different directory using 'service-account-path' input and place the JSON file there`
                ];

                throw new Error(
                    `Google service account JSON not found.\nPossible solutions:\n- ${solutions.join("\n- ")}`
                );
            }
        }
    }

    async ready(config: Config): Promise<void> {
        const pubspecDir = config.pubspecDir;
        const androidDir = config.androidDir;

        // Attempt to accept Android license.
        try {
            console.log("🛠️ Accepting Android licenses...");
            await exec("bash", ["-c", "yes | flutter doctor --android-licenses"]);
        } catch (error) {
            console.error("Failed to accept Android licenses:", error);
            throw error;
        }

        console.log("📄 Adding the fastlane folder in the android directory.");
        mkdirSync(join(pubspecDir, androidDir, "fastlane"), {recursive: true});

        console.log("📄 Adding Fastfile in the android directory.");
        writeFileSync(join(pubspecDir, androidDir, "fastlane", "Fastfile"), androidFastfileContent)

        console.log("📄 Adding Appfile in the android directory.");
        writeFileSync(
            join(pubspecDir, androidDir, "fastlane", "Appfile"),
            (androidAppfileContent as string)
                .replace("{service-account-path}", config.serviceAccountPath)
                .replace("{app-bundle-id}", config.androidAppId)
        );
    }

    async run(config: Config): Promise<void> {
        const pubspecDir = config.pubspecDir;
        const androidDir = config.androidDir;

        await Fastlane.run(
            join(pubspecDir, androidDir, "fastlane"),
            "android",
            "deploy",
            {
                ...config.baseOptions,
                "draft": config.draft,
                "build_dest_path": config.aabDestPath,
            },
        );
    }
}
