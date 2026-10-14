import { spawn } from "node:child_process";

// Selected E04 worker only. It has no network access, credential access, or writes.
// Both parent and descendant ignore TERM so the supervisor must escalate to KILL.
process.on("SIGTERM", () => {});
const descendant = spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], { stdio: "ignore" });
process.stdout.write(`DESCENDANT_PID=${descendant.pid}\n`);
const noise = "LAB_OUTPUT_ONLY ".repeat(512);
setInterval(() => process.stdout.write(noise), 1);
