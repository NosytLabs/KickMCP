import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { createMcpServer } from "./mcp.js";
import { createKickAuthorizationUrl, exchangeKickAuthorizationCode } from "./kick/oauth.js";
import { readStoredKickTokens } from "./kick/token-store.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "kick", kickUserTokenStored: Boolean(readStoredKickTokens()?.access_token) });
});

app.get("/kick/oauth/start", (_req, res, next) => {
  try {
    res.redirect(createKickAuthorizationUrl().toString());
  } catch (error) {
    next(error);
  }
});

app.get("/kick/oauth/callback", async (req, res, next) => {
  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    if (!code || !state) {
      res.status(400).send("Kick OAuth callback is missing code or state.");
      return;
    }

    const tokens = await exchangeKickAuthorizationCode(code, state);
    res.type("html").send(`
      <main style="font-family: system-ui; line-height: 1.4; max-width: 680px; margin: 48px auto;">
        <h1>KICK connected</h1>
        <p>Kick user token saved locally for scopes: ${tokens.scope ?? "unknown"}.</p>
        <p>You can close this tab and return to ChatGPT or your MCP client.</p>
      </main>
    `);
  } catch (error) {
    next(error);
  }
});

app.post("/kick/webhooks", (req, res) => {
  console.log("Kick webhook received", {
    id: req.header("Kick-Event-Message-Id"),
    type: req.header("Kick-Event-Type"),
    version: req.header("Kick-Event-Version"),
    timestamp: req.header("Kick-Event-Message-Timestamp"),
    body: req.body,
  });
  res.status(204).send();
});

app.all("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const httpServer = createServer(app);
httpServer.listen(config.port, () => {
  console.log(`KICK MCP server listening on http://localhost:${config.port}/mcp`);
});

