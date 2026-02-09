import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Star, Trash2, Sparkles, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";
import { useUpdateKnowledgeItem, useDeleteKnowledgeItem } from "@/hooks/useKnowledgeItems";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const typeColors: Record<string, string> = {
  note: "bg-accent text-accent-foreground",
  link: "bg-primary/10 text-primary",
  insight: "bg-muted text-muted-foreground",
  article: "bg-secondary text-secondary-foreground",
};

export function KnowledgeCard({ item, index }: { item: KnowledgeItem; index: number }) {
  const update = useUpdateKnowledgeItem();
  const remove = useDeleteKnowledgeItem();
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiProcess = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-process", {
        body: { itemId: item.id, title: item.title, content: item.content, url: item.url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await update.mutateAsync({ id: item.id, ai_summary: data.summary, ai_tags: data.tags });
      toast({ title: "AI processed", description: "Summary and tags generated." });
    } catch (err: any) {
      toast({ title: "AI error", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[item.item_type] || ""}`}>
              {item.item_type}
            </span>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <h3 className="font-medium text-card-foreground truncate">{item.title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => update.mutateAsync({ id: item.id, is_favorite: !item.is_favorite })}
          >
            <Star className={`w-3.5 h-3.5 ${item.is_favorite ? "fill-primary text-primary" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(item.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {item.content && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{item.content}</p>
      )}

      {item.ai_summary && (
        <div className="rounded-lg bg-accent/50 p-3 mb-3">
          <p className="text-xs font-medium text-accent-foreground mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Summary
          </p>
          <p className="text-sm text-muted-foreground">{item.ai_summary}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(item.tags || []).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
          {(item.ai_tags || []).map(tag => (
            <Badge key={`ai-${tag}`} variant="outline" className="text-xs font-normal gap-1">
              <Tag className="w-2.5 h-2.5" />{tag}
            </Badge>
          ))}
        </div>

        {!item.ai_summary && (
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 shrink-0" onClick={handleAiProcess} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Process
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </motion.div>
  );
}
