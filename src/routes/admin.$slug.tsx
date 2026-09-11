import { createFileRoute, Link } from "@tanstack/react-router";
import { CardEditor } from "@/components/admin/card-editor";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { Button } from "@/components/ui/button";
import { useCard, useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/admin/$slug")({ component: AdminEdit });

function AdminEdit() {
  const { slug } = Route.useParams();
  const hydrated = useCatalog((s) => s.hydrated);
  const card = useCard(slug);

  if (!card) {
    return (
      <Page>
        <LargeTitle>{hydrated ? "找不到这张卡" : "管理"}</LargeTitle>
        <Fade>
          {hydrated ? (
            <Button asChild className="w-full">
              <Link to="/admin">返回管理</Link>
            </Button>
          ) : (
            <p className="text-[15px] text-muted">正在读取本机资料…</p>
          )}
        </Fade>
      </Page>
    );
  }

  return (
    <Page>
      <Fade>
        <p className="text-[15px] font-medium text-accent">
          <Link to="/admin">管理</Link>
          <span className="mx-1 text-subtle">/</span>
          编辑
        </p>
      </Fade>
      <LargeTitle>{card.name}</LargeTitle>
      <Fade>
        <CardEditor key={`${card.slug}-${hydrated ? "h" : "s"}`} initial={card} />
      </Fade>
    </Page>
  );
}
