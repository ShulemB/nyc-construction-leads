import { useEffect, useState } from "react";
import { MapPin, ExternalLink, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "google_maps_api_key";

export function GoogleMapImage({
  latitude,
  longitude,
  address,
}: {
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  address?: string | null;
}) {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const k = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) ?? "" : "";
    setApiKey(k);
  }, []);

  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  if (!hasCoords) return null;

  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const staticUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=800x300&scale=2&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${encodeURIComponent(apiKey)}`
    : null;
  const streetUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x300&location=${lat},${lng}&fov=80&key=${encodeURIComponent(apiKey)}`
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {staticUrl ? (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <a href={mapsLink} target="_blank" rel="noreferrer" className="block">
            <img
              src={staticUrl}
              alt={address ? `Map of ${address}` : "Map"}
              className="h-48 w-full object-cover sm:h-56"
              loading="lazy"
            />
          </a>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="block">
            <img
              src={streetUrl!}
              alt={address ? `Street view of ${address}` : "Street view"}
              className="h-48 w-full object-cover sm:h-56"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/30 px-6 py-10 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Add your Google Maps API key to preview the location</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Stored locally in your browser. Used to load Static Maps & Street View imagery.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90"
          >
            <Settings className="h-3 w-3" /> Go to Settings
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {lat.toFixed(5)}, {lng.toFixed(5)}
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:underline"
          >
            Open in Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {!apiKey && (
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-3 w-3" /> Add API key
          </Link>
        )}
      </div>
    </div>
  );
}

