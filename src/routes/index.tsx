import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check as CheckIcon,
  Gauge,
  KeyRound,
  PlayCircle,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  FileDown,
} from "lucide-react";
import clawbenchLogo from "@/assets/clawbench-logo.png";

const Check = () => <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClawBench — Pick the right model for your coding agent" },
      {
        name: "description",
        content:
          "Benchmark your coding agent across Nebius Token Factory models, score the outputs, and generate routing rules that pick the best model per task.",
      },
      { property: "og:title", content: "ClawBench — Pick the right model for your coding agent" },
      {
        property: "og:description",
        content:
          "Benchmark your coding agent across Nebius models and auto-generate routing rules that pick the best model per task.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={clawbenchLogo}
              alt="ClawBench"
              className="h-8 w-auto"
            />
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Agent eval control plane
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <img
              src={clawbenchLogo}
              alt="ClawBench"
              className="mx-auto mb-8 h-20 w-auto sm:h-24"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Powered by Nebius Token Factory
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Pick the right model for your coding agent.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              ClawBench benchmarks your agent across open-weight models on Nebius, scores every
              output, and exports a <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">routing.md</code> your
              coding agent reads natively to pick the best model per task.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Start evaluating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline">How it works</Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> BYO API key — stays in your browser</span>
              <span className="inline-flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> One-command local tunnel</span>
              <span className="inline-flex items-center gap-1.5"><RouteIcon className="h-3.5 w-3.5" /> Auto-generated routing rules</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
              Three steps from a raw prompt to a production routing policy.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Step
                n={1}
                icon={<Terminal className="h-5 w-5" />}
                title="Connect your agent"
                body="Paste a one-shot snippet into your coding agent. It opens a public tunnel from your local agent to ClawBench using your own Nebius API key."
              />
              <Step
                n={2}
                icon={<PlayCircle className="h-5 w-5" />}
                title="Run evals across models"
                body="Pick a task type and the Nebius models you want to compare. ClawBench runs the prompt through each, judges the output, and ranks them on quality, cost, and latency."
              />
              <Step
                n={3}
                icon={<FileDown className="h-5 w-5" />}
                title="Export routing.md for your agent"
                body="ClawBench turns the winning models into a routing.md file — primary, fallback, and escalation rules per task type. Copy it into Cursor, Claude Code, or Lovable and your agent routes every prompt to the right model."
              />
            </div>
          </div>
        </section>

        {/* What you get — routing.md preview */}
        <section className="border-b border-border bg-muted/20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                <FileDown className="h-3 w-3" /> The deliverable
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                One file. Drop it into any coding agent.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">routing.md</code> is plain
                markdown — a summary table, per-task rules, and a decision algorithm your agent can follow without
                any SDK, plugin, or custom integration.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check /> Works with Cursor, Claude Code, Lovable, Continue, and any agent that reads context files.</li>
                <li className="flex gap-2"><Check /> Re-export anytime as your evals improve — version it in your repo.</li>
                <li className="flex gap-2"><Check /> Human-readable, so you can review and tweak before shipping.</li>
              </ul>
            </div>
            <pre className="overflow-auto rounded-lg border border-border bg-background p-5 font-mono text-[11px] leading-relaxed text-foreground shadow-sm">
{`# Routing Rules

## Summary
| Task type     | Primary       | Fallback      |
| ------------- | ------------- | ------------- |
| Debugging     | DeepSeek R1   | Kimi K2.5     |
| Coding        | Qwen Coder 32B| Llama 3.3 70B |
| Reasoning     | DeepSeek R1   | Llama 3.1 405B|

## Decision algorithm
function route(taskType, prompt):
  rule = rules[taskType] or rules["coding"]
  response = call(rule.primary_model, prompt)
  if response.confidence < rule.confidence_threshold:
    response = call(rule.fallback_model, prompt)
  return response`}
            </pre>
          </div>
        </section>

        {/* Value props */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-5 px-6 py-20 md:grid-cols-3">
            <Feature
              icon={<Trophy className="h-5 w-5" />}
              title="Stop guessing on model choice"
              body="Replace vibes with side-by-side scores on your real prompts — correctness, completeness, format reliability, and agent utility."
            />
            <Feature
              icon={<KeyRound className="h-5 w-5" />}
              title="Your keys, your data"
              body="Your Nebius API key stays in your browser. Your agent runs locally. ClawBench only orchestrates the evals."
            />
            <Feature
              icon={<Gauge className="h-5 w-5" />}
              title="Cost-aware routing"
              body="Every recommendation is scored on cost-per-quality-point so you don't pay for a frontier model when a 70B will do."
            />
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to route smarter?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Create a free account and run your first eval in minutes.
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Sign up free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© ClawBench</span>
          <span>OpenClaw • Nebius Token Factory</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="font-mono text-xs text-muted-foreground">Step {n}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
