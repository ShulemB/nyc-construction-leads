type V = string | number | null | undefined;

function F({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "" || children === "—";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${empty ? "text-muted-foreground" : ""}`}>{empty ? "—" : children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border px-5 py-4 first:border-t-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function PropertyInfoCard({ property: p }: { property: Record<string, V> }) {
  const fullStreet = [p.house_number, p.street_name].filter(Boolean).join(" ") || null;
  const ownerName = [p.owner_first_name, p.owner_last_name].filter(Boolean).join(" ") || null;
  const ownerAddr = [
    [p.owner_house_number, p.owner_street_name].filter(Boolean).join(" "),
    p.owner_city, [p.owner_state, p.owner_zip].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
  const showOwner = ownerName || p.owner_business_name || ownerAddr;
  const zoning = [p.zoning_dist1, p.zoning_dist2, p.zoning_dist3].filter(Boolean).join(" / ");
  const specialDistricts = [p.special_district1, p.special_district2].filter(Boolean).join(" / ");

  return (
    <aside className="sticky top-6 self-start rounded-xl border border-border bg-card">
      <Section title="Address">
        <F label="Street">{fullStreet}</F>
        <div className="grid grid-cols-3 gap-3">
          <F label="Borough">{p.borough}</F>
          <F label="ZIP">{p.owner_zip}</F>
          <F label="BIN">{p.bin}</F>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <F label="Block">{p.block}</F>
          <F label="Lot">{p.lot}</F>
          <F label="BBL">{p.bbl}</F>
        </div>
      </Section>

      <Section title="Building">
        <div className="grid grid-cols-2 gap-3">
          <F label="Type">{p.building_type}</F>
          <F label="Class">{p.building_class}</F>
          <F label="Stories">{p.existing_stories}</F>
          <F label="Height">{p.existing_height}</F>
          <F label="Dwelling units">{p.existing_dwelling_units}</F>
          <F label="Occupancy">{p.existing_occupancy}</F>
        </div>
        {(zoning || specialDistricts || p.landmarked || p.little_e) && (
          <div className="flex flex-wrap gap-1.5">
            {zoning && <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Zoning: {zoning}</span>}
            {specialDistricts && <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Special: {specialDistricts}</span>}
            {p.landmarked === "L" && <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">Landmarked</span>}
            {p.little_e && <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Little E: {p.little_e}</span>}
          </div>
        )}
      </Section>

      {showOwner && (
        <Section title="Owner">
          <F label="Name">{ownerName}</F>
          <F label="Business">{p.owner_business_name}</F>
          <F label="Address">{ownerAddr || null}</F>
          <F label="Type">{p.owner_type}</F>
        </Section>
      )}

      <Section title="Geo">
        <div className="grid grid-cols-2 gap-3">
          <F label="Community Board">{p.community_board}</F>
          <F label="Council District">{p.council_district}</F>
          <F label="Census Tract">{p.census_tract}</F>
          <F label="NTA">{p.nta}</F>
        </div>
      </Section>
    </aside>
  );
}
