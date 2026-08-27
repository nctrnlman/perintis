import { CoverLetterListBoard } from "@/components/cover-letter/cover-letter-list-board";
import { NewCoverLetterSheet } from "@/components/cover-letter/new-cover-letter-sheet";

export default function NewCoverLetterPage() {
  return (
    <>
      <CoverLetterListBoard />
      <NewCoverLetterSheet closeMode="replace" />
    </>
  );
}
