import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRoutingRule, getRoutingRules, saveRoutingRule } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, STRATEGIES, TASK_TYPES } from "@/lib/clawbench/constants";
import { Edit, Eye, FileDown, FlaskConical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoutingMdDialog } from "@/components/clawbench/routing-md-dialog";

export const Route = createFileRoute("/rules")({ component: RulesPage });

function RulesPage() {
  const qc = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: getRoutingRules });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const save = useMutation({
    mutationFn: saveRoutingRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rules"] });
      setOpen(false);
      setEditing(null);
      toast.success("Rule saved");
    },
  });

  const del = useMutation({
    mutationFn: deleteRoutingRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Rule deleted");
    },
  });

  const openNew = () => {
    setEditing({
      task_type: "debugging",
      primary_model: "kimi",
      fallback_model: "deepseek",
      strategy: "best_balance",
      confidence_threshold: 0.8,
      escalation_condition: "",
    });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Routing Rules"
        subtitle="Convert eval winners into production routing decisions."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setExportOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={rules.length === 0}
              title={rules.length === 0 ? "No rules yet — save a rule first" : undefined}
            >
              <FileDown className="h-4 w-4" /> Export routing.md
            </Button>
            <Button onClick={openNew} size="sm" className="gap-2"><Plus className="h-4 w-4" /> New rule</Button>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Task type", "Primary", "Fallback", "Strategy", "Confidence", "Supporting evals", "Updated", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {rules.map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{r.task_type}</td>
                  <td className="px-3 py-2">{MODELS.find((m) => m.id === r.primary_model)?.name ?? r.primary_model}</td>
                  <td className="px-3 py-2">{MODELS.find((m) => m.id === r.fallback_model)?.name ?? r.fallback_model ?? "—"}</td>
                  <td className="px-3 py-2">{r.strategy}</td>
                  <td className="px-3 py-2">{r.confidence_threshold ?? "—"}</td>
                  <td className="px-3 py-2">{r.supporting_eval_count}</td>
                  <td className="px-3 py-2">{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 gap-1">
                        <Link to="/history" search={{ task_type: r.task_type } as any}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => toast.info("Test rule (mock): would route to " + r.primary_model)}>
                        <FlaskConical className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-destructive" onClick={() => del.mutate(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rules.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
            No routing rules yet. Run an eval, save the winner as a rule, then export <code className="font-mono">routing.md</code> for your agent.
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Tip: click <span className="font-medium text-foreground">Export routing.md</span> to download these rules as a markdown file your coding agent can follow.
          </p>
        )}
      </div>

      <RoutingMdDialog open={exportOpen} onOpenChange={setExportOpen} rules={rules as any} />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit routing rule" : "New routing rule"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <Field label="Task type">
                <Select value={editing.task_type} onValueChange={(v) => setEditing({ ...editing, task_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary model">
                  <Select value={editing.primary_model} onValueChange={(v) => setEditing({ ...editing, primary_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fallback model">
                  <Select value={editing.fallback_model ?? ""} onValueChange={(v) => setEditing({ ...editing, fallback_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Strategy">
                <Select value={editing.strategy ?? ""} onValueChange={(v) => setEditing({ ...editing, strategy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Confidence threshold">
                <Input type="number" step="0.05" value={editing.confidence_threshold ?? ""} onChange={(e) => setEditing({ ...editing, confidence_threshold: +e.target.value })} />
              </Field>
              <Field label="Escalation condition">
                <Textarea value={editing.escalation_condition ?? ""} onChange={(e) => setEditing({ ...editing, escalation_condition: e.target.value })} rows={3} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
