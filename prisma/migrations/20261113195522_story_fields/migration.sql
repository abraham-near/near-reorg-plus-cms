-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "layout" TEXT,
ADD COLUMN     "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[];
