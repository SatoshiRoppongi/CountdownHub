-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('online', 'offline', 'hybrid');

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6),
    "location" VARCHAR(255),
    "venue_type" "VenueType",
    "site_url" VARCHAR(500),
    "image_url" VARCHAR(500),
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "author_name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "is_reported" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_start_datetime_idx" ON "events"("start_datetime");

-- CreateIndex
CREATE INDEX "events_is_active_idx" ON "events"("is_active");

-- CreateIndex
CREATE INDEX "events_tags_idx" ON "events"("tags");

-- CreateIndex
CREATE INDEX "comments_event_id_idx" ON "comments"("event_id");

-- CreateIndex
CREATE INDEX "comments_is_reported_idx" ON "comments"("is_reported");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
