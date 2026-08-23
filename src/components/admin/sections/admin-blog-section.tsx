"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  FileText, RefreshCw, Plus, Search, Eye, Pencil, Trash2,
  Sparkles, Loader2, LayoutGrid, Users, Hash, Eye as EyeIcon,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatDateLong, formatCompact, relativeTime, scoreHex,
} from "../admin-helpers";

// ----- API types -----
type PostStatus = "published" | "draft" | "scheduled" | "pending";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  status: PostStatus;
  excerpt: string;
  seoScore: number;
  readabilityScore: number;
  wordCount: number;
  focusKeyword: string;
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  views: number;
}

interface BlogCategory {
  name: string;
  postCount: number;
  color: string;
}

interface BlogAuthor {
  name: string;
  postCount: number;
}

interface BlogResponse {
  posts: BlogPost[];
  stats: {
    total: number;
    published: number;
    drafts: number;
    scheduled: number;
    pending: number;
    totalViews: number;
  };
  categories: BlogCategory[];
  authors: BlogAuthor[];
}

const STATUS_BADGE: Record<PostStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  pending: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
};

const TAG_CLS = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700";

const CAT_FALLBACK = "#64748b";

function categoryColor(name: string, cats: BlogCategory[]): string {
  return cats.find((c) => c.name === name)?.color ?? CAT_FALLBACK;
}

export function AdminBlogSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<BlogResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PostStatus>("all");
  const [catFilter, setCatFilter] = React.useState<string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [postToDelete, setPostToDelete] = React.useState<BlogPost | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/blog").then((r) => r.json() as Promise<BlogResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const cats = data?.categories ?? [];
  const authors = data?.authors ?? [];

  const filtered = React.useMemo(() => {
    let list = data?.posts ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    return list;
  }, [data?.posts, search, statusFilter, catFilter]);

  function togglePublish(post: BlogPost) {
    const next: PostStatus = post.status === "published" ? "draft" : "published";
    setData((prev) =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    status: next,
                    publishedAt: next === "published" ? new Date().toISOString() : null,
                  }
                : p,
            ),
          }
        : prev,
    );
    toast.success(next === "published" ? `Published "${post.title}"` : `Unpublished "${post.title}"`);
  }

  async function deletePost() {
    if (!postToDelete) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 400));
    setData((prev) =>
      prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== postToDelete.id) } : prev,
    );
    toast.success(`Deleted "${postToDelete.title}"`);
    setPostToDelete(null);
    setDeleting(false);
  }

  function addPost(post: BlogPost) {
    setData((prev) => (prev ? { ...prev, posts: [post, ...prev.posts] } : prev));
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Blog CMS"
        subtitle="Manage SEO-focused blog content"
        icon={FileText}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create post
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Posts" value={stats?.total ?? 0} icon={FileText} color="#10b981" />
        <StatCard label="Published" value={stats?.published ?? 0} icon={EyeIcon} color="#14b8a6" />
        <StatCard label="Drafts" value={stats?.drafts ?? 0} icon={Pencil} color="#64748b" />
        <StatCard label="Scheduled" value={stats?.scheduled ?? 0} icon={RefreshCw} color="#f59e0b" />
        <StatCard label="Total Views" value={formatCompact(stats?.totalViews ?? 0)} icon={Eye} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: filter + table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by title or author…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {cats.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-emerald-600" /> Blog Posts
              <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
              {loading ? (
                <SkeletonRows rows={5} cols={9} />
              ) : filtered.length === 0 ? (
                <EmptyState msg="No posts match your filters" icon={FileText} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">SEO</TableHead>
                      <TableHead className="text-right">Read</TableHead>
                      <TableHead className="text-right">Words</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="whitespace-nowrap">Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="zebra">
                    {filtered.map((p) => {
                      const cColor = categoryColor(p.category, cats);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium text-sm truncate max-w-[220px]" title={p.title}>
                              {p.title}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground truncate">/{p.slug}</div>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{p.author}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs" style={{
                              backgroundColor: `${cColor}15`,
                              color: cColor,
                              borderColor: `${cColor}40`,
                            }}>
                              {p.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {p.tags.slice(0, 2).map((t) => (
                                <Badge key={t} variant="outline" className={`text-[10px] ${TAG_CLS}`}>{t}</Badge>
                              ))}
                              {p.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{p.tags.length - 2}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`capitalize ${STATUS_BADGE[p.status]}`}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md font-bold tabular-nums text-xs"
                              style={{
                                backgroundColor: `${scoreHex(p.seoScore)}15`,
                                color: scoreHex(p.seoScore),
                              }}
                            >
                              {p.seoScore}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-xs">
                            {p.readabilityScore}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-xs">
                            {formatCompact(p.wordCount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-xs">
                            {formatCompact(p.views)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {p.publishedAt ? formatDateLong(p.publishedAt) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => toast.info(`Editing "${p.title}" (demo)`)}
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => toast.info(`Previewing "${p.title}" (demo)`)}
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => togglePublish(p)}
                                title={p.status === "published" ? "Unpublish" : "Publish"}
                              >
                                {p.status === "published" ? (
                                  <span className="text-[10px] font-medium px-1">Unpub</span>
                                ) : (
                                  <span className="text-[10px] font-medium px-1 text-emerald-700 dark:text-emerald-400">Pub</span>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-red-600 hover:text-red-700"
                                onClick={() => setPostToDelete(p)}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          {/* Categories */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-600" /> Categories
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => toast.info("Add category (demo)")}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {cats.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">{c.postCount}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Authors */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-600" /> Authors
            </h3>
            <div className="space-y-1.5">
              {authors.map((a) => (
                <div key={a.name} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{a.name}</span>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">{a.postCount}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Blog Generator */}
          <Card className="p-5 border-violet-200 dark:border-violet-800/60">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="font-semibold">AI Blog Generator</h3>
              <Badge variant="outline" className="ml-auto text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                Beta · Agency
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Generate SEO-optimized blog drafts with AI.
            </p>
            <AIBlogGenerator />
          </Card>
        </div>
      </div>

      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={cats}
        onCreated={addPost}
      />

      <AlertDialog open={!!postToDelete} onOpenChange={(o) => { if (!o) setPostToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{postToDelete?.title}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deletePost();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AIBlogGenerator() {
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState("professional");
  const [busy, setBusy] = React.useState(false);

  function run(kind: "outline" | "article") {
    if (!topic.trim()) {
      toast.error("Enter a topic first");
      return;
    }
    setBusy(true);
    toast.success("AI generating…", {
      description: `${kind === "outline" ? "Outline" : "Full article"} for "${topic}" (${tone})`,
    });
    setTimeout(() => {
      setBusy(false);
      toast.success(kind === "outline" ? "Outline generated (demo)" : "Draft article generated (demo)");
    }, 1200);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="ai-topic" className="text-xs">Topic</Label>
        <Input
          id="ai-topic"
          placeholder="e.g. How to optimize for AI search"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={() => run("outline")}>
          {busy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Hash className="w-3 h-3 mr-1" />}
          Generate outline
        </Button>
        <Button size="sm" className={`flex-1 ${EMERALD_BTN}`} disabled={busy} onClick={() => run("article")}>
          {busy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
          Generate article
        </Button>
      </div>
    </div>
  );
}

function CreatePostDialog({
  open,
  onOpenChange,
  categories,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: BlogCategory[];
  onCreated: (p: BlogPost) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("Admin");
  const [category, setCategory] = React.useState(categories[0]?.name ?? "Technical SEO");
  const [tags, setTags] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setAuthor("Admin");
      setCategory(categories[0]?.name ?? "Technical SEO");
      setTags("");
      setExcerpt("");
      setContent("");
    }
  }, [open, categories]);

  async function submit() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          excerpt: excerpt.trim(),
          content,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const json = (await res.json()) as { post: BlogPost };
      onCreated(json.post);
      toast.success("Draft created");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create blog post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="bp-title">Title</Label>
            <Input
              id="bp-title"
              placeholder="The complete guide to AEO"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bp-author">Author</Label>
              <Input
                id="bp-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="Technical SEO">Technical SEO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bp-tags">Tags (comma-separated)</Label>
            <Input
              id="bp-tags"
              placeholder="aeo, ai, optimization"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bp-excerpt">Excerpt</Label>
            <Textarea
              id="bp-excerpt"
              placeholder="Short summary used in previews & social cards"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bp-content">Content (Markdown)</Label>
            <Textarea
              id="bp-content"
              placeholder="Write the post body…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              {content ? content.split(/\s+/).filter(Boolean).length : 0} words
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
