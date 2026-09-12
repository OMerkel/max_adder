import { spawnSync } from "node:child_process";

const run = (cmd) => spawnSync(cmd, { stdio: "inherit", shell: true });

let result = run("npm run test");
if ((result.status ?? 1) !== 0) {
	process.exit(result.status ?? 1);
}

result = run("npm run test:e2e");
process.exit(result.status ?? 1);
