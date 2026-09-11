import { createFileRoute } from "@tanstack/react-router";
import { getRates } from "@/lib/rates";

export const Route = createFileRoute("/api/rates")({
  server: {
    handlers: {
      GET: async () => {
        const rates = await getRates();
        return Response.json(rates);
      },
    },
  },
});
