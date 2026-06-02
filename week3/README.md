# Week 3 — Daily Standup AI Agent (N8N + Claude Code)

## Setup

### Requirements
- Docker Desktop running
- Claude account (company plan)

### Quick Start

```bash
cd week3/n8n-nodes-claude-code-cli/docker/production/n8n-with-claude-code
mkdir -p workspace claude-config mcp-servers
docker compose up -d --build
# Wait ~2 minutes for build

# Authenticate Claude (one-time, requires browser)
docker exec -it claude-code-runner claude login
```

N8N available at: http://localhost:5678

### N8N Setup (one-time, in browser)
1. Create owner account at http://localhost:5678
2. Install community node: **Settings → Community Nodes → Install → `n8n-nodes-claude-code-cli`**
3. Create API key: **Settings → n8n API → Create API Key**

### Add Slack Bot Token (required for Slack integration)
Update the Slack credential in N8N with a real `xoxb-...` token:
```bash
curl -s -X PATCH -H "X-N8N-API-KEY: <your-key>" -H "Content-Type: application/json" \
  -d '{"data":{"accessToken":"xoxb-YOUR-SLACK-TOKEN","notice":"","allowedDomains":"slack.com"}}' \
  http://localhost:5678/api/v1/credentials/QZNUvREza76cysko
```
Or update it manually in N8N UI: Credentials → Slack Bot Token → Edit.

---

## Integration Method

**n8n-nodes-claude-code-cli Docker stack** — N8N + `claude-code-runner` container on same Docker daemon. Node uses `docker exec` to call Claude CLI inside the container.

---

## Architecture

```
Direction 1 (N8N → Claude):
[Schedule Trigger: 9AM Mon-Fri]
         │
         ├─→ [GitHub HTTP: commits last 24h]    ─┐
         ├─→ [Redmine HTTP: my open issues]     ─┼→ [Merge All Sources]
         └─→ [Slack: read messages today]       ─┘
                                                   │
                                      [Code: Merge & Format Activity]
                                                   │ (+ loads previous standup)
                                      [Claude Code CLI: generate standup]
                                                   │
                                      [Save Standup to Memory]
                                                   │
                                      [Slack: Post to DM]

Direction 2 (Claude → N8N via MCP):
[Claude: "Run my standup for today"]
         │
         MCP tool: run_standup_workflow
         │
[N8N Webhook Trigger] → (same workflow above)
```

---

## Workflow Files

| File | Description |
|------|-------------|
| `workflows/standup-workflow.json` | Full N8N workflow (10 nodes, both entry points) |
| `mcp-config/standup-mcp-server.js` | MCP server exposing `run_standup_workflow` tool |
| `.mcp.json` | Claude Code MCP configuration |

---

## Data Sources

| Source | N8N Node | Endpoint |
|--------|----------|----------|
| GitHub | HTTP Request | `api.github.com/repos/ThangND-ZigeXn/claude-code-course/commits?since=<yesterday>` |
| Redmine | HTTP Request | `dev.zigexn.vn/issues.json?assigned_to_id=me` |
| Slack | Slack node | Read messages (requires `xoxb-` token) |

---

## Memory

Uses **N8N static workflow data** (`$getWorkflowStaticData('global')`) to persist the previous standup across runs:
- After each run, saves standup text + date to static data
- On next run, loads previous standup and injects into Claude's prompt as context
- Claude can answer "What did I report yesterday?" based on this context

**Verified:** Run 4 correctly referenced Run 3's standup content.

---

## MCP Tool Usage

```bash
# From Claude Code CLI (week3/ must be cwd or .mcp.json in path)
# After: /mcp reload or start new session

# Then type in Claude:
"Run my standup for today"
# → Claude calls run_standup_workflow → N8N webhook fires → workflow runs
```

Or test directly:
```bash
curl -X POST http://localhost:5678/webhook/standup \
  -H "Content-Type: application/json" -d '{"source":"manual"}'
```

---

## Credentials Created

| Credential | N8N ID | Status |
|-----------|--------|--------|
| GitHub Token | `9CHoRbtPav7E7dlM` | ✅ Working |
| Redmine API Key | `mYqqL98pLtwGsKQ5` | ✅ Working |
| Claude Code Docker | `rhn7wIl6FrXe5hFM` | ✅ Working |
| Slack Bot Token | `QZNUvREza76cysko` | ⚠️ Needs real `xoxb-` token |

---

## Verification Log

| Run | Trigger | Status | Claude Output |
|-----|---------|--------|---------------|
| #1 | Webhook | Partial (Slack auth fail) | Standup generated from GitHub commit 500613b |
| #2 | Webhook + Merge fix | Partial | All 3 sources fetched, standup generated |
| #3 | Webhook (memory run 1) | Partial | Standup saved to memory |
| #4 | Webhook (memory run 2) | Partial | Claude referenced Run 3's standup ✅ |
| #5 | MCP server call | Partial | Triggered via MCP tool, workflow ran ✅ |

All "partial" = Slack Post fails because placeholder token. GitHub + Redmine + Claude all working ✅.
