/** Utility class for running Fastlane commands programmatically. */
export declare class Fastlane {
    static sanitizeEnv(env: NodeJS.ProcessEnv): Record<string, string>;
    /** Executes a Fastlane lane with dynamic options. */
    static run(entryDir: string, platform: string, laneName: string, options?: Record<string, string | number>, env?: Record<string, string>): Promise<void>;
}
