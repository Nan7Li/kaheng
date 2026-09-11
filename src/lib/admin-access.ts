import { useEffect, useState } from "react";
import { getAdminStatus } from "./admin.functions";
import { useCurrentUserState } from "./auth/use-current-user";

export { writeErrorMessage } from "./write-error";

export function useAdminAccess() {
  const { user, isPending } = useCurrentUserState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setIsAdmin(false);
      setReady(true);
      return;
    }
    let live = true;
    void getAdminStatus()
      .then((status) => {
        if (!live) return;
        setIsAdmin(status.isAdmin);
        setReady(true);
      })
      .catch(() => {
        if (!live) return;
        setIsAdmin(false);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, [user, isPending]);

  return { user, isPending: isPending || !ready, isAdmin };
}
