import { exec } from "@actions/exec";

/** Utility class for running Fastlane commands programmatically. */
export class Fastlane {
    static sanitizeEnv(env: NodeJS.ProcessEnv): Record<string, string> {
        return Object.fromEntries(
            Object.entries(env).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))
        );
    }

    /** Executes a Fastlane lane with dynamic options. */
    static async run(
        entryDir: string,
        platform: string,
        laneName: string,
        options?: Record<string, string | number>,
        env?: Record<string, string>
    ) {
        const optionArgs = options
            ? Object.entries(options)
                .filter(([_, value]) => value != null && value !== "")
                .map(([key, value]) => `"${key}:${value.toString().replaceAll('"', '\\"')}"`)
                .join(" ")
            : "";

        const command = `fastlane ${platform} ${laneName} ${optionArgs}`;
        await exec(command, [], {
            cwd: entryDir,
            env: {
                ...this.sanitizeEnv(process.env),
                ...env
            },
        });
    }
}
