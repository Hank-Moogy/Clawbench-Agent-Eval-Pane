import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Terminal, X } from "lucide-react";
import { toast } from "sonner";

const TUNNEL_SNIPPET = `# ClawBench agent tunnel setup
# Paste this into your coding agent (Cursor / Claude Code / Lovable / etc.)
# so it can expose your local agent to ClawBench for routing-rule evaluation.

# 1. Make sure your agent exposes an HTTP endpoint locally, e.g.:
#      POST http://localhost:8787/run
#      body: { "prompt": string, "model": string }
#      returns: { "output": string, "tokens"?: number, "latency_ms"?: number }

# 2. Open a public tunnel to that port (pick one):
#    Cloudflare:  cloudflared tunnel --url http://localhost:8787
#    ngrok:       ngrok http 8787
#    bore:        bore local 8787 --to bore.pub

# 3. Copy the public https URL the tunnel prints, then in ClawBench:
#      Settings -> Agent endpoint -> paste <public-url>/run
#      Rules    -> define routing rules (task type -> model)
#      Run Eval -> ClawBench will POST prompts through your tunnel,
#                  score outputs, and recommend a routing policy.

# 4. Keep the tunnel process running while evaluating.
`;

export function AgentTunnelOnboarding() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(TUNNEL_SNIPPET);
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
            Copy this snippet and paste it into your coding agent. It will set up a public tunnel to your local
            agent so ClawBench can run prompts against it and define routing rules.
          </p>
          <div className="relative mt-3">
            <pre className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
{TUNNEL_SNIPPET}
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
