import { useEffect, useState } from "react";
import { MapPin, Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const k = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) ?? "" : "";
    setApiKey(k);
    setInput(k);
  }, []);

  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const save = () => {
    const trimmed = input.trim();
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
      setApiKey(trimmed);
      toast.success("Google Maps API key saved");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      setApiKey("");
      toast.success("Google Maps API key cleared");
    }
    setOpen(false);
  };

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
              <Key className="h-3 w-3" /> {apiKey ? "Change key" : "Add API key"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Google Maps API key</DialogTitle>
              <DialogDescription>
                Enter a Google Maps API key with Static Maps API and Street View Static API enabled. The key is stored
                only in your browser's local storage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="gmaps-key">API key</Label>
              <Input
                id="gmaps-key"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Get one at{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  Google Cloud Console
                </a>
                .
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
