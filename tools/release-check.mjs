import { execFileSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (command, args) => {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, CI: "1" },
  });
};

// Keep the release gate deliberately browser-free. Playwright remains an
// opt-in local/manual workflow so a production release check cannot consume
// runner credits or open a Chromium process unexpectedly.
run(npm, ["test", "--", "--run"]);
run(npm, ["run", "asset:3d:test"]);
run(npm, ["run", "build"]);
run(npm, ["run", "check:bundle"]);
run(npm, ["run", "check:secrets"]);
run("git", ["diff", "--check"]);

console.log("\nRelease check passed: unit, asset, build, bundle, secret, and diff gates.");
