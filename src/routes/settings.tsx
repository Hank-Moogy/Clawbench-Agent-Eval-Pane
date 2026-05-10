import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings, testConnection } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MODELS } from "@/lib/clawbench/constants";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [url, setUrl] = useState("");
  const mode: "real" = "real";
  const [names, setNames] = useState<Record<string, string>>({});
  const [lastTest, setLastTest] = useState<{ ok: boolean; message: string; at: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setUrl(settings.agent_runner_api_url ?? "");
      setMode(settings.api_mode);
      setNames(settings.model_display_names ?? {});
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => saveSettings({ api_mode: mode, agent_runner_api_url: url, model_display_names: names }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
  });

  const test = useMutation({
    mutationFn: () => testConnection(url, mode),
    onSuccess: (res) => {
      setLastTest({ ...res, at: new Date().toLocaleString() });
      res.ok ? toast.success(res.message) : toast.error(res.message);
    },
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Prepare ClawBench for the real Agent Runner API." />
      <div className="grid gap-5 p-6 lg:grid-cols-2">
        <Section title="API mode">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Real Agent Runner API
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every eval is executed against the configured Agent Runner tunnel. No mock fallback.
            </p>
          </div>
        </Section>

        <Section title="Agent Runner API">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tunnel URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-tunnel.trycloudflare.com"
            className="mt-1.5 font-mono text-sm"
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending} size="sm">Save</Button>
            <Button onClick={() => test.mutate()} disabled={test.isPending} size="sm" variant="outline" className="gap-2">
              {test.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Test connection
            </Button>
          </div>
        </Section>

        <Section title="Connection status">
          <dl className="grid gap-2 text-sm">
            <Row k="Active mode" v={<span className="font-mono">{mode}</span>} />
            <Row k="Last test" v={lastTest ? `${lastTest.at} — ${lastTest.message}` : "never"} />
            <Row k="Status" v={lastTest ? (lastTest.ok ? <span className="text-primary">OK</span> : <span className="text-destructive">FAIL</span>) : "—"} />
            <Row k="Endpoints" v={<span className="font-mono text-xs">POST /run-eval • GET /health</span>} />
          </dl>
        </Section>

        <Section title="Security notes">
          <div className="flex gap-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
            <ul className="space-y-1.5 leading-relaxed">
              <li>Do not expose Nebius API keys in the frontend.</li>
              <li>Do not expose OpenClaw Gateway tokens in the frontend.</li>
              <li>The Agent Runner API owns secrets server-side.</li>
              <li>ClawBench only calls the public HTTPS wrapper.</li>
            </ul>
          </div>
        </Section>

        <Section title="Model display names" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {MODELS.map((m) => (
              <div key={m.id}>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.id}</Label>
                <Input
                  value={names[m.id] ?? m.name}
                  onChange={(e) => setNames({ ...names, [m.id]: e.target.value })}
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
            ))}
          </div>
          <Button onClick={() => save.mutate()} size="sm" className="mt-4">Save display names</Button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-5 ${className}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border/60 pb-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-xs">{v}</dd>
    </div>
  );
}
