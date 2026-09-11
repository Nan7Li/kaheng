import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Divider, Fade, Field, Group, LargeTitle, Page } from "@/components/ios";
import { XPostList } from "@/components/x-post-card";
import { Button } from "@/components/ui/button";
import { useAdminAccess, writeErrorMessage } from "@/lib/admin-access";
import { useCatalog } from "@/lib/catalog";
import { usePosts } from "@/lib/posts";
import { fetchXPost } from "@/lib/x-post";

export const Route = createFileRoute("/posts")({ component: PostsPage });

function PostsPage() {
  const cards = useCatalog((s) => s.cards);
  const posts = usePosts((s) => s.posts);
  const hydrate = usePosts((s) => s.hydrate);
  const add = usePosts((s) => s.add);
  const remove = usePosts((s) => s.remove);
  const { isAdmin } = useAdminAccess();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [cardSlug, setCardSlug] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function onAdd() {
    setBusy(true);
    try {
      const fetched = await fetchXPost(url);
      await add(fetched, { cardSlug: cardSlug || undefined, note: note.trim() || undefined });
      setUrl("");
      setNote("");
      toast.success("已加入文章");
    } catch (err) {
      toast.error(writeErrorMessage(err, err instanceof Error ? err.message : "加不进去"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <LargeTitle eyebrow="官方帖">X 文章</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted">
          {isAdmin
            ? "把 x.com 的帖子链接贴进来，会显示给所有人，也能挂到对应的卡上。"
            : "用来核对官方费率口径。添加和删除只有管理员能做。"}
        </p>
      </Fade>

      {isAdmin && (
        <Group header="添加" footer="支持 x.com 或 twitter.com 的 /status/ 链接。">
          <Field
            label="链接"
            value={url}
            onChange={setUrl}
            placeholder="https://x.com/you/status/…"
            type="url"
          />
          <Divider />
          <div className="px-4 py-3">
            <p className="mb-2 text-[13px] text-subtle">挂到哪张卡（可选）</p>
            <select
              value={cardSlug}
              onChange={(e) => setCardSlug(e.target.value)}
              className="h-11 w-full rounded-[14px] bg-surface-2 px-3 text-[15px] text-fg outline-none"
            >
              <option value="">不挂钩</option>
              {cards.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Divider />
          <Field label="备注" value={note} onChange={setNote} placeholder="比如：官方费率口径" />
          <Divider />
          <div className="px-4 py-3">
            <Button className="w-full" disabled={busy || !url.trim()} onClick={() => void onAdd()}>
              {busy ? "读取中" : "添加文章"}
            </Button>
          </div>
        </Group>
      )}

      <Group
        header={`已收藏 · ${posts.length}`}
        footer={isAdmin ? "点打开原文会跳到 X。删除会改公开列表。" : "点打开原文会跳到 X。"}
      >
        <XPostList
          posts={posts}
          cardNameOf={(slug) => cards.find((c) => c.slug === slug)?.name}
          onRemove={
            isAdmin
              ? (id) => {
                  void remove(id)
                    .then(() => toast.success("已删除"))
                    .catch((err) => toast.error(writeErrorMessage(err, "删除失败")));
                }
              : undefined
          }
          empty="还没有文章。"
        />
      </Group>

      {posts.some((p) => p.cardSlug) && (
        <Group header="已挂钩的卡">
          {cards
            .filter((c) => posts.some((p) => p.cardSlug === c.slug))
            .map((c, i) => (
              <div key={c.slug}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
                {isAdmin ? (
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between px-4 text-left pressable"
                    onClick={() => setCardSlug(c.slug)}
                  >
                    <span className="text-[15px]">{c.name}</span>
                    <span className="text-[13px] text-subtle">
                      {posts.filter((p) => p.cardSlug === c.slug).length} 篇
                    </span>
                  </button>
                ) : (
                  <Link
                    to="/card/$slug"
                    params={{ slug: c.slug }}
                    className="flex min-h-12 w-full items-center justify-between px-4 pressable"
                  >
                    <span className="text-[15px]">{c.name}</span>
                    <span className="text-[13px] text-subtle">
                      {posts.filter((p) => p.cardSlug === c.slug).length} 篇
                    </span>
                  </Link>
                )}
              </div>
            ))}
        </Group>
      )}
    </Page>
  );
}
