import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Divider, Fade, Field, Group, LargeTitle, Page } from "@/components/ios";
import { XPostList } from "@/components/x-post-card";
import { Button } from "@/components/ui/button";
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
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [cardSlug, setCardSlug] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function onAdd() {
    setBusy(true);
    try {
      const fetched = await fetchXPost(url);
      add(fetched, { cardSlug: cardSlug || undefined, note: note.trim() || undefined });
      setUrl("");
      setNote("");
      toast.success("已加入文章");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加不进去");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <LargeTitle eyebrow="贴自己的帖子">X 文章</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted">
          把 x.com 的帖子链接贴进来，就会显示在这页，也能挂到对应的卡上。保存在这台设备，完整卡号不会经过这里。
        </p>
      </Fade>

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
        <Field label="备注" value={note} onChange={setNote} placeholder="比如：我写的费率对照" />
        <Divider />
        <div className="px-4 py-3">
          <Button className="w-full" disabled={busy || !url.trim()} onClick={() => void onAdd()}>
            {busy ? "读取中" : "添加文章"}
          </Button>
        </div>
      </Group>

      <Group header={`已收藏 · ${posts.length}`} footer="点打开原文会跳到 X。删除只影响这台设备。">
        <XPostList
          posts={posts}
          cardNameOf={(slug) => cards.find((c) => c.slug === slug)?.name}
          onRemove={(id) => {
            remove(id);
            toast.success("已删除");
          }}
          empty="还没有文章。把你写过的费率帖贴上来。"
        />
      </Group>

      {posts.some((p) => p.cardSlug) && (
        <Group header="已挂钩的卡">
          {cards
            .filter((c) => posts.some((p) => p.cardSlug === c.slug))
            .map((c, i) => (
              <div key={c.slug}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
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
              </div>
            ))}
        </Group>
      )}
    </Page>
  );
}
