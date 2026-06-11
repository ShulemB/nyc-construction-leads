import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewDeedButtonProps {
  block?: string | null | undefined;
  lot?: string | null | undefined;
  borough?: string | null | undefined;
  bbl?: string | null | undefined;
}

function getBoroughCode(borough: string | null | undefined): string | null {
  if (!borough) return null;
  const map: Record<string, string> = {
    "1": "1", "manhattan": "1",
    "2": "2", "bronx": "2",
    "3": "3", "brooklyn": "3",
    "4": "4", "queens": "4",
    "5": "5", "staten island": "5",
  };
  return map[borough.toLowerCase().trim()] ?? null;
}

export function ViewDeedButton({ block, lot, borough, bbl }: ViewDeedButtonProps) {
  if (!block || !lot) return null;

  const handleViewDeed = () => {
    let url: string;

    if (bbl) {
      url = `https://a836-acris.nyc.gov/DS/DocumentSearch/BBL?BBL=${bbl}&bbl_doctype=DEED`;
    } else {
      const boroughCode = getBoroughCode(borough);
      if (boroughCode) {
        const formattedBbl =
          boroughCode +
          block.padStart(5, "0") +
          lot.padStart(4, "0");
        url = `https://a836-acris.nyc.gov/DS/DocumentSearch/BBL?BBL=${formattedBbl}&bbl_doctype=DEED`;
      } else {
        url = `https://a836-acris.nyc.gov/DS/DocumentSearch/BBL?bbl_block=${block}&bbl_lot=${lot}&bbl_doctype=DEED`;
      }
    }

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
