import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/gmap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get("type");
        const address = url.searchParams.get("address");
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          return new Response("Server is not configured with a Google Maps API key", { status: 503 });
        }
        if (!address || address.length > 300) {
          return new Response("Missing or invalid address", { status: 400 });
        }
        if (type !== "static" && type !== "streetview") {
          return new Response("Invalid type", { status: 400 });
        }

        const enc = encodeURIComponent(address);
        const upstream =
          type === "static"
            ? `https://maps.googleapis.com/maps/api/staticmap?center=${enc}&zoom=18&size=800x300&scale=2&maptype=roadmap&markers=color:red%7C${enc}&key=${encodeURIComponent(apiKey)}`
            : `https://maps.googleapis.com/maps/api/streetview?size=800x300&location=${enc}&fov=80&key=${encodeURIComponent(apiKey)}`;

        const res = await fetch(upstream);
        if (!res.ok) {
          return new Response(`Upstream error: ${res.status}`, { status: res.status });
        }
        const buf = await res.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
