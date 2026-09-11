import { create } from "zustand";
import type { FetchedXPost } from "./x-post.ts";

export interface XArticle {
  id: string;
  url: string;
  handle: string;
  name: string;
  text: string;
  createdAt?: string;
  avatar?: string;
  cardSlug?: string;
  note?: string;
  addedAt: string;
}

export const POST_SEED: XArticle[] = [
  {
    id: "2094272494211600583",
    url: "https://x.com/MEXCZH/status/2094272494211600583",
    handle: "MEXCZH",
    name: "MEXC_華語",
    text: "MEXC Global Card：0 开卡费、0 年费、0 储值手续费；9/30 前消费 0 手续费；日常消费最高返 10%。邀请好友开卡每人 40 USDT。",
    createdAt: "Mon Aug 31 03:54:06 +0000 2026",
    cardSlug: "mexc",
    note: "官方华语号，用来核对全球卡活动费率。",
    addedAt: "2026-09-10",
  },
  {
    id: "2097845034355748992",
    url: "https://x.com/okx/status/2097845034355748992",
    handle: "okx",
    name: "OKX",
    text: "OKX Card now gives you 2% cashback, up to €100 in September.",
    createdAt: "Thu Sep 10 00:30:06 +0000 2026",
    cardSlug: "okx-eea",
    note: "官方账号，对应欧洲卡 2026-09 基础返现封顶活动。",
    addedAt: "2026-09-10",
  },
];

export function isArticle(raw: unknown): raw is XArticle {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Partial<XArticle>;
  return typeof p.id === "string" && typeof p.url === "string" && typeof p.text === "string";
}

interface PostsState {
  posts: XArticle[];
  hydrated: boolean;
  hydrating: boolean;
  hydrate: () => Promise<void>;
  add: (post: FetchedXPost, extra?: { cardSlug?: string; note?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  patch: (id: string, next: Partial<Pick<XArticle, "cardSlug" | "note">>) => Promise<void>;
}

export const usePosts = create<PostsState>()((set, get) => ({
  posts: POST_SEED,
  hydrated: false,
  hydrating: false,
  hydrate: async () => {
    if (get().hydrated || get().hydrating) return;
    set({ hydrating: true });
    try {
      const { listPosts } = await import("./posts.functions");
      const posts = await listPosts();
      set({ posts, hydrated: true, hydrating: false });
    } catch {
      set({ hydrated: true, hydrating: false });
    }
  },
  add: async (post, extra) => {
    const { savePost } = await import("./posts.functions");
    const article: XArticle = {
      ...post,
      cardSlug: extra?.cardSlug || undefined,
      note: extra?.note || undefined,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    const saved = await savePost({ data: article });
    set({ posts: [saved, ...get().posts.filter((p) => p.id !== saved.id)] });
  },
  remove: async (id) => {
    const { removePost } = await import("./posts.functions");
    await removePost({ data: id });
    set({ posts: get().posts.filter((p) => p.id !== id) });
  },
  patch: async (id, next) => {
    const { savePost } = await import("./posts.functions");
    const current = get().posts.find((p) => p.id === id);
    if (!current) return;
    const saved = await savePost({ data: { ...current, ...next } });
    set({ posts: get().posts.map((p) => (p.id === id ? saved : p)) });
  },
}));

export function postsForCard(posts: XArticle[], slug: string): XArticle[] {
  return posts.filter((p) => p.cardSlug === slug);
}
