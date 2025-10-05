import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export class SSH {
    static async register(sshPrivateKey: string) {
        console.log("🔑 Creating temporary SSH key file for Fastlane...");
        const tmpKeyPath = join(tmpdir(), "fastlane_ssh_key");
        writeFileSync(tmpKeyPath, sshPrivateKey.replace(/\\n/g, "\n"), { mode: 0o600 });

        // 2. ssh-agent
        const agentOutput = execSync("ssh-agent -s").toString();
        const sshAuthSockMatch = agentOutput.match(/SSH_AUTH_SOCK=([^\s;]+)/);
        const sshAgentPidMatch = agentOutput.match(/SSH_AGENT_PID=([0-9]+)/);

        if (!sshAuthSockMatch || !sshAgentPidMatch) {
            throw new Error("Failed to start ssh-agent");
        }

        process.env.SSH_AUTH_SOCK = sshAuthSockMatch[1];
        process.env.SSH_AGENT_PID = sshAgentPidMatch[1];

        execSync(`ssh-add ${tmpKeyPath}`);
        console.log("🔑 SSH key added successfully to ssh-agent");
    }
}
