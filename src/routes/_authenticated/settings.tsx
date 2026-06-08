import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Key, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export const STORAGE_KEY = "google_maps_api_key";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — PermitLeads" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [mapsKey, setMapsKey] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    const k = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) ?? "" : "";
    setMapsKey(k);
    setInput(k);
  }, []);

  const saveMapsKey = () => {
    const trimmed = input.trim();
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
      setMapsKey(trimmed);
      toast.success("Google Maps API key saved");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      setMapsKey("");
      toast.success("Google Maps API key cleared");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal preferences and API keys.
        </p>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-muted-foreground" />
                Google Maps API key
              </CardTitle>
              <CardDescription>
                Used to load Static Maps and Street View imagery on filing detail pages. The key is stored only in your browser's local storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                  .
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveMapsKey}>
                  {mapsKey ? "Update key" : "Save key"}
                </Button>
                {mapsKey && (
                  <Button variant="outline" onClick={() => { setInput(""); saveMapsKey(); }}>
                    Clear key
                  </Button>
                )}
              </div>
              {mapsKey && (
                <p className="text-xs text-muted-foreground">
                  Key is set and active.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
