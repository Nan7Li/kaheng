import { createFileRoute, Link } from "@tanstack/react-router";
import { CardEditor } from "@/components/admin/card-editor";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { createBlankCard } from "@/lib/catalog";

export const Route = createFileRoute("/admin/new")({ component: AdminNew });

function AdminNew() {
  return (
    <Page>
      <Fade>
        <p className="text-[15px] font-medium text-accent">
          <Link to="/admin">管理</Link>
          <span className="mx-1 text-subtle">/</span>
          新增
        </p>
      </Fade>
      <LargeTitle>新卡</LargeTitle>
      <Fade>
        <CardEditor initial={createBlankCard()} isNew />
      </Fade>
    </Page>
  );
}
