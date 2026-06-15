import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewDeedButtonProps {
  borough: string | null | undefined;
  block: string | null | undefined;
  lot: string | null | undefined;
}

const BOROUGH_CODES: Record<string, string> = {
  MANHATTAN: "1",
  BRONX: "2",
  BROOKLYN: "3",
  QUEENS: "4",
  "STATEN ISLAND": "5",
};

function buildAcrisUrl(borough: string, block: string, lot: string): string {
  const code = BOROUGH_CODES[borough.toUpperCase().trim()] ?? "1";
  const paddedBlock = block.trim().padStart(5, "0");
  const paddedLot = lot.trim().padStart(4, "0");
  return `http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${code}&block=${paddedBlock}&lot=${paddedLot}`;
}

export function ViewDeedButton({ borough, block, lot }: ViewDeedButtonProps) {
  if (!borough || !block || !lot) return null;

  const handleViewDeed = () => {
    const url = buildAcrisUrl(borough, block, lot);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleViewDeed}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      View Deed
    </Button>
  );
}
