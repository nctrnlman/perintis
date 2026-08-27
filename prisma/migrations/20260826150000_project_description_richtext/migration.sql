-- AlterTable: add the new rich-text description column
ALTER TABLE "Project" ADD COLUMN "description" TEXT;

-- Data migration: preserve existing bullet lists by converting them into
-- an equivalent HTML bullet list, matching how WorkExperience.description
-- is authored via the rich text editor.
UPDATE "Project"
SET "description" = (
  SELECT '<ul>' || string_agg(
    '<li>' || replace(replace(replace(b, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</li>',
    ''
  ) || '</ul>'
  FROM unnest("bullets") AS b
  WHERE b IS NOT NULL AND btrim(b) <> ''
)
WHERE array_length("bullets", 1) IS NOT NULL;

-- AlterTable: drop the old array column now that its data has been migrated
ALTER TABLE "Project" DROP COLUMN "bullets";
