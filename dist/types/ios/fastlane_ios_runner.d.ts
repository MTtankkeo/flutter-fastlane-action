import { Config } from "../lib/config";
import { FastlaneRunner } from "../lib/fastlane_runner";
/**
 * iOS-specific fastlane runner handling file generation and build execution
 * Implements the shared runner lifecycle for the iOS platform.
 */
export declare class FastlaneIosRunner extends FastlaneRunner {
    get name(): string;
    print(config: Config): void;
    initialize(config: Config): Promise<void>;
    ready(config: Config): Promise<void>;
    run(config: Config): Promise<void>;
}
