import { spawn } from "node:child_process";
import { once } from "node:events";

const smokePort = process.env.SMOKE_PORT ?? "8977";
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${smokePort}`;
let server;

async function waitForHealth() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Keep polling while the local server starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health`);
}

async function ensureServer() {
  if (process.env.SMOKE_BASE_URL) return;
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (response.ok) return;
  } catch {
    // Start a local server below.
  }

  server = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: smokePort, PUBLIC_BASE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  server.once("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Smoke-test server exited with code ${code}`);
    }
  });
  await waitForHealth();
}

async function callMcp(path, method, params = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`${path} ${method} failed: ${response.status} ${raw}`);
  const jsonText = raw.replace(/^event: message\ndata: /, "").trim();
  return JSON.parse(jsonText);
}

async function callTool(path, name, args = {}) {
  return callMcp(path, "tools/call", { name, arguments: args });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isToolError(result) {
  return Boolean(result?.result?.isError);
}

async function main() {
  await ensureServer();

  const devTools = await callMcp("/mcp", "tools/list");
  const chatgptTools = await callMcp("/chatgpt/mcp", "tools/list");
  const devNames = devTools.result.tools.map((tool) => tool.name);
  const chatgptNames = chatgptTools.result.tools.map((tool) => tool.name);

  assert(devNames.length === 23, `Expected 23 developer tools, got ${devNames.length}`);
  assert(chatgptNames.length === 9, `Expected 9 ChatGPT tools, got ${chatgptNames.length}`);
  assert(devNames.includes("kick_delete_chat_message"), "Developer profile should include chat delete.");
  assert(!chatgptNames.includes("kick_delete_chat_message"), "ChatGPT profile should not include chat delete.");
  console.log("ok tool profiles");

  const live = await callTool("/mcp", "kick_get_livestreams", { limit: 1, sort: "viewer_count" });
  assert(!isToolError(live), live.result?.content?.[0]?.text ?? "kick_get_livestreams failed");
  const livestream = live.result.structuredContent.livestreams[0];
  assert(livestream?.slug, "Expected at least one livestream with a slug.");
  console.log(`ok livestreams: ${livestream.slug}`);

  const channels = await callTool("/mcp", "kick_get_channels", { slugs: [livestream.slug] });
  assert(!isToolError(channels), channels.result?.content?.[0]?.text ?? "kick_get_channels failed");
  assert(channels.result.structuredContent.channels.length >= 1, "Expected channel lookup result.");
  console.log("ok channels");

  const categories = await callTool("/mcp", "kick_get_categories", { names: ["Just Chatting"], limit: 3 });
  assert(!isToolError(categories), categories.result?.content?.[0]?.text ?? "kick_get_categories failed");
  console.log("ok categories");

  const publicKey = await callTool("/mcp", "kick_get_public_key");
  assert(!isToolError(publicKey), publicKey.result?.content?.[0]?.text ?? "kick_get_public_key failed");
  console.log("ok public key");

  const events = await callTool("/mcp", "kick_list_event_subscriptions");
  assert(!isToolError(events), events.result?.content?.[0]?.text ?? "kick_list_event_subscriptions failed");
  console.log("ok event subscriptions");

  const drops = await callTool("/mcp", "kick_get_drops_claims", { limit: 1 });
  if (isToolError(drops)) {
    console.log(`skipped kick_get_drops_claims: ${drops.result.content[0].text}`);
  } else {
    console.log("ok drops claims");
  }

  const userTokenPresent = Boolean(process.env.KICK_USER_ACCESS_TOKEN);
  const userTokenTools = [
    ["kick_get_channel_rewards", {}],
    ["kick_get_reward_redemptions", {}],
    ["kick_get_kicks_leaderboard", { top: 10 }],
  ];

  for (const [name, args] of userTokenTools) {
    const result = await callTool("/mcp", name, args);
    if (userTokenPresent) {
      assert(!isToolError(result), result.result?.content?.[0]?.text ?? `${name} failed`);
      console.log(`ok ${name}`);
    } else {
      assert(isToolError(result), `${name} should require a user token in this environment.`);
      console.log(`skipped ${name}: user token required`);
    }
  }

  const writeTools = [
    "kick_update_channel",
    "kick_send_chat_message",
    "kick_delete_chat_message",
    "kick_create_channel_reward",
    "kick_update_channel_reward",
    "kick_delete_channel_reward",
    "kick_accept_reward_redemptions",
    "kick_reject_reward_redemptions",
    "kick_create_event_subscriptions",
    "kick_delete_event_subscriptions",
    "kick_verify_webhook_signature",
    "kick_ban_or_timeout_user",
    "kick_unban_user",
  ];
  console.log(`not executed destructive/write tools: ${writeTools.join(", ")}`);
}

try {
  await main();
} finally {
  if (server) {
    server.kill();
    await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 500))]);
  }
}
