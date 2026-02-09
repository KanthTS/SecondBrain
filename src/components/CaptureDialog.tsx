import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useCreateKnowledgeItem } from "@/hooks/useKnowledgeItems";
import { useToast } from "@/hooks/use-toast";

export function CaptureDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [itemType, setItemType] = useState<string>("note");
  const [tagsInput, setTagsInput] = useState("");
  const create = useCreateKnowledgeItem();
  const { toast } = useToast();

  const reset = () => {
    setTitle("");
    setContent("");
    setUrl("");
    setItemType("note");
    setTagsInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    try {
      await create.mutateAsync({ title, content, url: url || null, item_type: itemType, tags });
      toast({ title: "Captured!", description: "Knowledge item saved." });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Capture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Capture Knowledge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cap-title">Title</Label>
            <Input id="cap-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="What did you learn?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="insight">Insight</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap-url">URL (optional)</Label>
              <Input id="cap-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-content">Content</Label>
            <Textarea id="cap-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Notes, excerpts, thoughts..." rows={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-tags">Tags (comma-separated)</Label>
            <Input id="cap-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="ai, productivity, design" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
