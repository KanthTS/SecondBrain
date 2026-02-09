import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get user's knowledge items for context
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    let knowledgeContext = "";
    if (user) {
      const { data: items } = await supabase
        .from("knowledge_items")
        .select("title, content, ai_summary, tags, ai_tags, item_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (items && items.length > 0) {
        knowledgeContext = items.map((i, idx) =>
          `[${idx + 1}] ${i.item_type}: "${i.title}"${i.ai_summary ? ` — ${i.ai_summary}` : i.content ? ` — ${i.content?.slice(0, 200)}` : ""}${i.tags?.length ? ` (tags: ${[...(i.tags || []), ...(i.ai_tags || [])].join(", ")})` : ""}`
        ).join("\n");
      }
    }

    const systemPrompt = `You are a helpful Second Brain assistant. You help users query and understand their personal knowledge base.

${knowledgeContext ? `Here are the user's knowledge items:\n${knowledgeContext}\n\nUse these items to answer questions. Reference specific items when relevant. If the question is not related to their knowledge base, still help but note that.` : "The user has no knowledge items yet. Encourage them to start capturing knowledge."}

Be concise, insightful, and helpful. If referencing a knowledge item, mention its title.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI chat error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
