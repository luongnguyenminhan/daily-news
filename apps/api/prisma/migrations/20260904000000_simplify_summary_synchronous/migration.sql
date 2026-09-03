-- AlterEnum
BEGIN;
CREATE TYPE "SummaryStatus_new" AS ENUM ('DONE', 'FAILED');
ALTER TABLE "public"."Summary" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Summary" ALTER COLUMN "status" TYPE "SummaryStatus_new" USING ("status"::text::"SummaryStatus_new");
ALTER TYPE "SummaryStatus" RENAME TO "SummaryStatus_old";
ALTER TYPE "SummaryStatus_new" RENAME TO "SummaryStatus";
DROP TYPE "public"."SummaryStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Summary" DROP COLUMN "batchName",
ALTER COLUMN "status" DROP DEFAULT;
