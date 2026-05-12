import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { buildRoutingMarkdown, type RoutingRule } from "@/lib/clawbench/routing-markdown";

export function RoutingMdDialog({
  open,
  onOpenChange,
  rules,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rules: RoutingRule[];
}) {
  const md = useMemo(() => buildRoutingMarkdown(rules), [rules]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Copied routing.md to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "routing.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded routing.md");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export routing.md</DialogTitle>
          <DialogDescription>
            Copy or download this file and paste it into your coding agent. It encodes every rule below as
            instructions the agent can follow.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[55vh] overflow-auto rounded-md border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">
{md}
        </pre>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy markdown"}
          </Button>
          <Button onClick={download} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download routing.md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
