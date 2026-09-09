import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "页面出了一点问题，刷新即可。";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-loss" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">这一页刚才卡住了</h1>
      <p className="max-w-md text-sm break-words text-muted">{errorMessage(error)}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 h-11 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-fg"
      >
        刷新页面
      </button>
    </main>
  );
}
