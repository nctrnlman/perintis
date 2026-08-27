import { CareerFitListBoard } from "@/components/career-fit/career-fit-list-board";
import { NewAnalysisSheet } from "@/components/career-fit/new-analysis-sheet";

export default function NewAnalysisPage() {
  return (
    <>
      <CareerFitListBoard />
      <NewAnalysisSheet closeMode="replace" />
    </>
  );
}
