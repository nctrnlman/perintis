import { AtsCheckListBoard } from "@/components/ats-check/ats-check-list-board";
import { NewAtsCheckSheet } from "@/components/ats-check/new-ats-check-sheet";

export default function NewAtsCheckPage() {
  return (
    <>
      <AtsCheckListBoard />
      <NewAtsCheckSheet closeMode="replace" />
    </>
  );
}
