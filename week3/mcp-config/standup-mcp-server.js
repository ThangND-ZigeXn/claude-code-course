#!/usr/bin/env node
/**
 * MCP server that exposes `run_standup_workflow` tool.
 * When called, it POSTs to the N8N webhook that triggers the Daily Standup AI Agent.
 */

const http = require("http");
const readline = require("readline");

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/standup";

const TOOLS = [
  {
    name: "run_standup_workflow",
    description:
      "Trigger the Daily Standup AI Agent in N8N. " +
      "Fetches GitHub commits, Redmine issues, and Slack messages, " +
      "then generates a standup report via Claude Code and posts it to Slack DM.",
    inputSchema: {
      type: "object",
      properties: {
        note: {
          type: "string",
          description: "Optional extra note to include in today's standup.",
        },
      },
      required: [],
    },
  },
];

function triggerN8NWebhook(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(N8N_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message) {
  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n"
  );
}

const rl = readline.createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  if (msg.method === "initialize") {
    sendResponse(msg.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "n8n-standup-mcp", version: "1.0.0" },
    });
  } else if (msg.method === "tools/list") {
    sendResponse(msg.id, { tools: TOOLS });
  } else if (msg.method === "tools/call") {
    if (msg.params.name === "run_standup_workflow") {
      try {
        const note = msg.params.arguments?.note || "";
        const result = await triggerN8NWebhook({ source: "claude-mcp", note });
        sendResponse(msg.id, {
          content: [
            {
              type: "text",
              text:
                `✅ Standup workflow triggered! ` +
                `N8N is now fetching GitHub/Redmine/Slack data, ` +
                `generating your standup with Claude, and posting to your Slack DM.\n` +
                `HTTP status: ${result.statusCode}`,
            },
          ],
        });
      } catch (err) {
        sendResponse(msg.id, {
          content: [{ type: "text", text: `❌ Failed to trigger webhook: ${err.message}` }],
        });
      }
    } else {
      sendError(msg.id, -32601, `Unknown tool: ${msg.params.name}`);
    }
  } else {
    sendResponse(msg.id, {});
  }
});
