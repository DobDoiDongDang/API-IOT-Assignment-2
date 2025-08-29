CREATE TABLE "books" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"published_at" timestamp NOT NULL,
	"genre_id" bigint
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE set null ON UPDATE no action;