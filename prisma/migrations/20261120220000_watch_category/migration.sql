-- The Watch category: video posts go in it by default (src/cms/lib/posts/service.ts), so the blog lists them under Watch.
-- Kept as it is when a category with this slug already exists.
INSERT INTO "Category" ("id", "name", "slug") VALUES ('watch', 'Watch', 'watch') ON CONFLICT ("slug") DO NOTHING;
