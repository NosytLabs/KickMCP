import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { createMcpServer } from "./mcp.js";
import { createKickAuthorizationUrl, exchangeKickAuthorizationCode } from "./kick/oauth.js";
import { readStoredKickTokens } from "./kick/token-store.js";
import { verifyWebhookSignature } from "./kick/client.js";

const app = express();
const seenWebhookMessageIds = new Map<string, number>();

app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString("utf8");
  },
}));

function pruneWebhookReplayCache(now = Date.now()) {
  const expiresBefore = now - config.kickWebhookTimestampToleranceMs;
  for (const [messageId, seenAt] of seenWebhookMessageIds) {
    if (seenAt < expiresBefore || seenWebhookMessageIds.size > 10_000) {
      seenWebhookMessageIds.delete(messageId);
    }
  }
}

function authorizeMcpRequest(req: express.Request, res: express.Response) {
  if (!config.requireMcpAuth) return true;

  if (!config.mcpAuthToken) {
    res.status(500).json({ ok: false, message: "MCP auth is required, but MCP_AUTH_TOKEN is not configured." });
    return false;
  }

  const authorization = req.header("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerToken = req.header("x-mcp-auth-token");

  if (bearerToken === config.mcpAuthToken || headerToken === config.mcpAuthToken) {
    return true;
  }

  res.status(401).json({ ok: false, message: "Unauthorized MCP request." });
  return false;
}

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
        <p>You can close this tab and return to your MCP client.</p>
      </main>
    `);
  } catch (error) {
    next(error);
  }
});

app.post("/kick/webhooks", async (req, res, next) => {
  try {
    const messageId = req.header("Kick-Event-Message-Id");
    const timestamp = req.header("Kick-Event-Message-Timestamp");
    const signature = req.header("Kick-Event-Signature");
    const rawBody = (req as express.Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
    let verified: boolean | undefined;

    const hasAnySignatureHeader = Boolean(messageId || timestamp || signature);
    if (config.verifyWebhookSignatures && !hasAnySignatureHeader) {
      res.status(401).json({ ok: false, message: "Missing Kick webhook signature headers." });
      return;
    }

    if (hasAnySignatureHeader && (!messageId || !timestamp || !signature)) {
      res.status(400).json({ ok: false, message: "Incomplete Kick webhook signature headers." });
      return;
    }

    if (messageId && timestamp && signature) {
      const sentAt = Date.parse(timestamp);
      if (!Number.isFinite(sentAt)) {
        res.status(400).json({ ok: false, message: "Invalid Kick webhook timestamp." });
        return;
      }

      const now = Date.now();
      if (Math.abs(now - sentAt) > config.kickWebhookTimestampToleranceMs) {
        res.status(400).json({ ok: false, message: "Kick webhook timestamp is outside the allowed tolerance." });
        return;
      }

      pruneWebhookReplayCache(now);
      if (seenWebhookMessageIds.has(messageId)) {
        res.status(409).json({ ok: false, message: "Duplicate Kick webhook message." });
        return;
      }

      verified = (await verifyWebhookSignature({ messageId, timestamp, signature, body: rawBody, publicKeyPem: config.kickWebhookPublicKeyPem })).verified;
      if (!verified) {
        res.status(401).json({ ok: false, message: "Invalid Kick webhook signature." });
        return;
      }
      seenWebhookMessageIds.set(messageId, now);
    }

    console.log("Kick webhook received", {
      id: req.header("Kick-Event-Message-Id"),
      type: req.header("Kick-Event-Type"),
      version: req.header("Kick-Event-Version"),
      timestamp: req.header("Kick-Event-Message-Timestamp"),
      verified,
      body_keys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

async function handleMcpRequest(req: express.Request, res: express.Response) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

app.all("/mcp", async (req, res) => {
  if (!authorizeMcpRequest(req, res)) return;
  await handleMcpRequest(req, res);
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  console.error("KickMCP request failed", { message });
  res.status(500).json({ ok: false, message: process.env.NODE_ENV === "production" ? "Internal server error." : message });
});

const httpServer = createServer(app);
httpServer.listen(config.port, () => {
  console.log(`KICK MCP server listening on http://localhost:${config.port}/mcp`);
});
