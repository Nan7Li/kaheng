export function writeErrorMessage(err: unknown, fallback = "保存失败"): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "Unauthorized") return "请先登录管理员";
  if (msg === "Forbidden") return "你不是管理员，不能改公开资料";
  return msg || fallback;
}
