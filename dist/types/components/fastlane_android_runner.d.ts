import { FastlaneRunner } from "./fastlane_runner";
import { Config } from "./config";
/**
 * Android-specific fastlane runner handling file generation and build execution
 * Implements the shared runner lifecycle for the Android platform.
 */
export declare class FastlaneAndroidRunner extends FastlaneRunner {
    get name(): string;
    print(config: Config): void;
    initialize(config: Config): Promise<void>;
    ready(config: Config): Promise<void>;
    run(config: Config): Promise<void>;
}
