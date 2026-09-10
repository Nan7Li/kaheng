import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Trash2 } from "lucide-react";
import type { XArticle } from "@/lib/posts";
import { cn } from "@/lib/utils";

export function XPostCard({
  post,
  cardName,
  onRemove,
}: {
  post: XArticle;
  cardName?: string;
  onRemove?: () => void;
}) {
  return (
    <article className="px-4 py-3">
      <div className="flex items-start gap-3">
        {post.avatar ? (
          <img
            src={post.avatar}
            alt=""
            className="mt-0.5 size-9 shrink-0 rounded-full bg-surface-2 object-cover"
          />
        ) : (
          <div className="mt-0.5 size-9 shrink-0 rounded-full bg-surface-2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[15px] font-medium">{post.name || post.handle}</p>
            {post.handle && <p className="truncate text-[12px] text-subtle">@{post.handle}</p>}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-fg">{post.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-subtle">
            {cardName && post.cardSlug && (
              <Link to="/card/$slug" params={{ slug: post.cardSlug }} className="text-accent">
                {cardName}
              </Link>
            )}
            {post.note && <span>{post.note}</span>}
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-0.5 text-accent"
            >
              打开原文
              <ArrowUpRight className="size-3" />
            </a>
            {onRemove && (
              <button type="button" onClick={onRemove} className="inline-flex items-center gap-0.5 text-loss pressable">
                <Trash2 className="size-3" />
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function XPostList({
  posts,
  cardNameOf,
  onRemove,
  empty,
}: {
  posts: XArticle[];
  cardNameOf?: (slug: string) => string | undefined;
  onRemove?: (id: string) => void;
  empty?: string;
}) {
  if (!posts.length) {
    return <p className={cn("px-4 py-6 text-[15px] text-subtle")}>{empty ?? "还没有文章。"}</p>;
  }
  return (
    <div>
      {posts.map((post, i) => (
        <div key={post.id}>
          {i > 0 && <div className="ml-4 h-px bg-border" />}
          <XPostCard
            post={post}
            cardName={post.cardSlug ? cardNameOf?.(post.cardSlug) : undefined}
            onRemove={onRemove ? () => onRemove(post.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
