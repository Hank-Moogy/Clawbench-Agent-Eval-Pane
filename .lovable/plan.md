## Goal

1. On `/rules`, generate a `routing.md` file from the saved rules — copyable and downloadable — so the user can hand it to their coding agent as routing instructions.
2. Update the landing page to advertise this as the final step: "Export a routing.md your agent reads natively."

Both will work cleanly: rules already live in the `routing_rules` table and load via `getRoutingRules()`.

## What gets built

### 1. Markdown generator
New file `src/lib/clawbench/routing-markdown.ts` — pure function `buildRoutingMarkdown(rules, models)`:
- Header + short intro telling the agent how to use the file.
- Summary table at the top: task type → primary → fallback.
- One section per task type with: primary model, fallback model, strategy, confidence threshold, escalation condition, supporting eval count.
- "Decision algorithm" footer explaining the routing logic in plain steps (try primary → if confidence < threshold or escalation condition matches → fall back).
- Generated timestamp + ClawBench attribution.

### 2. Routing Rules page (`src/routes/rules.tsx`)
- New header action **"Export routing.md"** next to "New rule".
- Opens a dialog showing the rendered markdown in a scrollable code block with **Copy** and **Download `routing.md`** buttons. Download uses a `Blob` + temporary `<a>` link — no new deps.
- Disabled (with tooltip "No rules yet") when `rules.length === 0`.
- Empty-state hint under the table when there are no rules: "Run an eval, save the winner as a rule, then export this file for your agent."

### 3. Landing page (`src/routes/index.tsx`)
- Update **Step 3** in "How it works" from a generic "Ship a routing policy" copy to explicitly mention the `routing.md` export and the agent-paste workflow.
- Add a new **"What you get"** sub-section (or a fourth feature card) with a small mock of a `routing.md` snippet so visitors immediately understand the deliverable.
- Tweak hero subcopy to mention "exports a `routing.md` your coding agent reads natively."

### 4. New component
`src/components/clawbench/routing-md-dialog.tsx` — dialog with copy + download, reused only on `/rules`.

## Out of scope (ask if you want it)

- Persisting the generated markdown in the DB.
- Per-rule selection / checkboxes — export currently includes all rules.
- A public route serving raw `routing.md` (possible via a server route, but not needed for the copy/paste flow).
