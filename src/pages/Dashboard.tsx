import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Search, LogOut, Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import { CaptureDialog } from "@/components/CaptureDialog";
import { ChatPanel } from "@/components/ChatPanel";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: items, isLoading } = useKnowledgeItems();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [favOnly, setFavOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!items) return [];
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        i => i.title.toLowerCase().includes(q) ||
          i.content?.toLowerCase().includes(q) ||
          i.tags?.some(t => t.toLowerCase().includes(q)) ||
          i.ai_tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") result = result.filter(i => i.item_type === typeFilter);
    if (favOnly) result = result.filter(i => i.is_favorite);

    result = [...result].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [items, search, typeFilter, sortBy, favOnly]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-semibold text-foreground hidden sm:block">Second Brain</h1>
          </div>
          <div className="flex items-center gap-3">
            <CaptureDialog />
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container px-4 sm:px-6 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Your Knowledge Base
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Capture, organize, and query your knowledge with AI. Every idea in one place.
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="container px-4 sm:px-6 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search knowledge..."
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="link">Links</SelectItem>
              <SelectItem value="insight">Insights</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="alpha">A → Z</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={favOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setFavOnly(!favOnly)}
          >
            <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-current" : ""}`} />
            Favorites
          </Button>
        </div>
      </section>

      {/* Grid */}
      <section className="container px-4 sm:px-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {items?.length === 0 ? "Start capturing knowledge" : "No items match your filters"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, i) => (
              <KnowledgeCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>

      <ChatPanel />
    </div>
  );
}
