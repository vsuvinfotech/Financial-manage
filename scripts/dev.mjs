import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  {
    name: "api",
    color: "\x1b[36m",
    args: ["run", "dev", "-w", "@sfm/api"],
  },
  {
    name: "web",
    color: "\x1b[32m",
    args: ["run", "dev", "-w", "@sfm/web"],
  },
];

const children = processes.map(({ name, color, args }) => {
  const child = spawn(npmCommand, args, {
    shell: false,
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });

  const prefix = `${color}[${name}]\x1b[0m`;
  child.stdout.on("data", (data) => process.stdout.write(`${prefix} ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`${prefix} ${data}`));
  child.on("exit", (code) => {
    const status = code === 0 ? "exited" : `exited with code ${code}`;
    process.stdout.write(`${prefix} ${status}\n`);
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
