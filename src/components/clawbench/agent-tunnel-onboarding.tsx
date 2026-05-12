import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Eye, EyeOff, KeyRound, Link2, Terminal, X } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/lib/api/clawbench";

const STORAGE_KEY = "clawbench.nebius_api_key";
const TUNNEL_KEY = "clawbench.tunnel_url";

function buildSnippet(apiKey: string) {
  const keyLine = apiKey
    ? `export NEBIUS_API_KEY="${apiKey}"`
    : `export NEBIUS_API_KEY="<paste your Nebius API key — get one at https://studio.nebius.com>"`;

  return `# ClawBench agent tunnel setup
# Paste this into your coding agent (Cursor / Claude Code / Lovable / etc.)
# so it can expose your local agent to ClawBench for routing-rule evaluation.

# 1. Set your Nebius API key as an env var (used by the local agent to call models):
${keyLine}

# 2. Run a tiny local agent that proxies prompts to Nebius Token Factory.
#    Expose: POST http://localhost:8787/run
#      body:    { "prompt": string, "model": string }
#      returns: { "output": string, "tokens"?: number, "latency_ms"?: number }
#    The agent should call:
#      POST https://api.studio.nebius.com/v1/chat/completions
#      headers: Authorization: Bearer $NEBIUS_API_KEY
#      body:    { "model": <model>, "messages": [{ "role": "user", "content": <prompt> }] }

# 3. Open a public tunnel to that port (pick one):
#    Cloudflare:  cloudflared tunnel --url http://localhost:8787
#    ngrok:       ngrok http 8787
#    bore:        bore local 8787 --to bore.pub

# 4. Copy the public https URL the tunnel prints, then in ClawBench:
#      Settings -> Agent endpoint -> paste <public-url>/run
#      Rules    -> define routing rules (task type -> model)
#      Run Eval -> ClawBench will POST prompts through your tunnel,
#                  score outputs, and recommend a routing policy.

# 5. Keep the tunnel process running while evaluating.
`;
}

export function AgentTunnelOnboarding() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
    const t = localStorage.getItem(TUNNEL_KEY);
    if (t) setTunnelUrl(t);
  }, []);

  const saveKey = (v: string) => {
    setApiKey(v);
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  const saveTunnel = (v: string) => {
    setTunnelUrl(v);
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(TUNNEL_KEY, v);
      else localStorage.removeItem(TUNNEL_KEY);
    }
  };

  const persistTunnel = async () => {
    const trimmed = tunnelUrl.trim().replace(/\/$/, "");
    if (!trimmed) return;
    try {
      await saveSettings({ agent_runner_api_url: trimmed });
      toast.success("Tunnel URL saved");
    } catch {
      toast.error("Failed to save tunnel URL");
    }
  };

  if (dismissed) return null;

  const snippet = buildSnippet(apiKey);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied — paste it into your coding agent");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-md border border-primary/40 bg-primary/10 p-2 text-primary">
          <Terminal className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Connect your agent in one step</h3>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your Nebius API key, then copy the snippet into your coding agent. It will set up a public
            tunnel to your local agent so ClawBench can run prompts and define routing rules.
          </p>

          <div className="mt-3">
            <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <KeyRound className="h-3 w-3" /> Nebius API key
            </Label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => saveKey(e.target.value)}
                  placeholder="nbk_..."
                  className="pr-9 font-mono text-xs"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Stored locally in your browser only — never sent to ClawBench. Get a key at{" "}
              <a
                href="https://studio.nebius.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                studio.nebius.com
              </a>
              .
            </p>
          </div>

          <div className="mt-3">
            <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Link2 className="h-3 w-3" /> Tunnel URL
            </Label>
            <Input
              type="url"
              value={tunnelUrl}
              onChange={(e) => saveTunnel(e.target.value)}
              onBlur={persistTunnel}
              placeholder="https://your-tunnel.trycloudflare.com"
              className="mt-1.5 font-mono text-xs"
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Public HTTPS URL from your tunnel (cloudflared, ngrok, bore). ClawBench will POST <code className="font-mono">/run-eval</code> here. Saved to your Settings on blur.
            </p>
          </div>

          <div className="relative mt-3">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
{snippet}
            </pre>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copy}
              className="absolute right-2 top-2 h-7 gap-1.5 px-2 text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
