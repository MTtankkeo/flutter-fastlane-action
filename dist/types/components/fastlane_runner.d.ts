import { Config } from "./config";
/**
 * Defines a base interface for all platform fastlane runners
 * Provides a unified lifecycle: initialize → print → ready → run
 * Each platform implements its own steps based on the given configuration
 */
export declare abstract class FastlaneRunner {
    /** Returns the runner name used for logging and identification */
    abstract get name(): string;
    /** Initializes platform-specific settings and environment before executing any steps */
    abstract initialize(config: Config): Promise<void>;
    /** Prints platform-specific metadata or build information */
    abstract print(config: Config): void;
    /** Prepares the platform environment right before the build starts */
    abstract ready(config: Config): Promise<void>;
    /** Executes the full fastlane build and upload process */
    abstract run(config: Config): Promise<void>;
}
