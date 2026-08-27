"use client";

import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import {
  ApplicationDetailFields,
  type ApplicationDetailFieldsProps,
} from "@/components/application-tracker/application-detail-fields";

interface ApplicationDetailSheetProps extends ApplicationDetailFieldsProps {
  /**
   * "back" pops the browser history entry created by the soft-nav Link that
   * opened the intercepted modal. "replace" is for the hard-navigation
   * fallback route, where there's no in-app history entry to pop to.
   */
  closeMode?: "back" | "replace";
}

export function ApplicationDetailSheet({ closeMode = "back", ...props }: ApplicationDetailSheetProps) {
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        if (closeMode === "replace") {
          router.replace("/application-tracker");
        } else {
          router.back();
        }
      }}
    >
      <SheetContent>
        <SheetTitle className="sr-only">
          {props.initialCompanyName || props.initialPositionTitle}
        </SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <ApplicationDetailFields {...props} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
