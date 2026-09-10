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

const KEY = "kaheng-posts-v1";

const SEED: XArticle[] = [
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

function readStored(): XArticle[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const posts = parsed.filter(isArticle);
    return posts.length ? posts : null;
  } catch {
    return null;
  }
}

function isArticle(raw: unknown): raw is XArticle {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Partial<XArticle>;
  return typeof p.id === "string" && typeof p.url === "string" && typeof p.text === "string";
}

function writeStored(posts: XArticle[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(posts));
  } catch {
    /* quota */
  }
}

interface PostsState {
  posts: XArticle[];
  hydrated: boolean;
  hydrate: () => void;
  add: (post: FetchedXPost, extra?: { cardSlug?: string; note?: string }) => void;
  remove: (id: string) => void;
  patch: (id: string, next: Partial<Pick<XArticle, "cardSlug" | "note">>) => void;
}

export const usePosts = create<PostsState>()((set, get) => ({
  posts: SEED,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = readStored();
    set({ posts: stored ?? SEED, hydrated: true });
  },
  add: (post, extra) => {
    const article: XArticle = {
      ...post,
      cardSlug: extra?.cardSlug || undefined,
      note: extra?.note || undefined,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    const posts = [article, ...get().posts.filter((p) => p.id !== article.id)];
    writeStored(posts);
    set({ posts });
  },
  remove: (id) => {
    const posts = get().posts.filter((p) => p.id !== id);
    writeStored(posts);
    set({ posts });
  },
  patch: (id, next) => {
    const posts = get().posts.map((p) => (p.id === id ? { ...p, ...next } : p));
    writeStored(posts);
    set({ posts });
  },
}));

export function postsForCard(posts: XArticle[], slug: string): XArticle[] {
  return posts.filter((p) => p.cardSlug === slug);
}
