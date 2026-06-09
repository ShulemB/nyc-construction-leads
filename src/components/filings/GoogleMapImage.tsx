export function GoogleMapImage({
  houseNumber,
  streetName,
  borough,
  address,
}: {
  houseNumber: string | number | null | undefined;
  streetName: string | null | undefined;
  borough: string | null | undefined;
  address?: string | null;
}) {
  const addrString = `${houseNumber ?? ""} ${streetName ?? ""}, ${borough ?? ""}, NY`.trim();
  const hasAddress = !!houseNumber && !!streetName && !!borough;

  if (!hasAddress) return null;

  const encodedAddr = encodeURIComponent(addrString);
  const mapsLink = `https://www.google.com/maps?q=${encodedAddr}`;
  const staticUrl = `/api/public/gmap?type=static&address=${encodedAddr}`;
  const streetUrl = `/api/public/gmap?type=streetview&address=${encodedAddr}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <a href={mapsLink} target="_blank" rel="noreferrer" className="block">
          <img
            src={staticUrl}
            alt={address ? `Map of ${address}` : "Map"}
            className="h-48 w-full object-cover sm:h-56"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </a>
        <a href={mapsLink} target="_blank" rel="noreferrer" className="block">
          <img
            src={streetUrl}
            alt={address ? `Street view of ${address}` : "Street view"}
            className="h-48 w-full object-cover sm:h-56"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </a>
      </div>
    </div>
  );
}
