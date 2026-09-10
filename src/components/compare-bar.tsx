import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog";
import { useDesk } from "@/lib/store";

export function CompareBar() {
  const selected = useDesk((s) => s.selected);
  const toggle = useDesk((s) => s.toggleSelected);
  const clear = useDesk((s) => s.clearSelected);
  const cards = useCatalog((s) => s.cards);

  if (selected.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.6rem] z-30 px-3 lg:bottom-5 lg:left-[var(--app-sidebar)]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-[24px] px-3 py-2 glass lg:ml-0 lg:max-w-xl">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.map((slug) => {
            const card = cards.find((c) => c.slug === slug);
            if (!card) return null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggle(slug)}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-surface px-2.5 text-[12px] font-medium text-fg pressable"
              >
                {card.name}
                <X className="size-3 text-subtle" />
              </button>
            );
          })}
        </div>
        <button type="button" onClick={clear} className="text-[13px] text-subtle pressable">
          清空
        </button>
        <Button asChild size="sm">
          <Link to="/compare">比较</Link>
        </Button>
      </div>
    </div>
  );
}
