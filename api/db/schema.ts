import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

export const genres = t.pgTable("genres", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  title: t
    .varchar({
      length: 255,
    })
    .notNull(),
});

export const books = t.pgTable("books", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  title: t
    .varchar({
      length: 255,
    })
    .notNull(),
  author: t
    .varchar({
      length: 255,
    })
    .notNull(),
  info: t
    .varchar({
      length: 255,
    }),
  summary: t
    .varchar({
      length: 255,
    }),
  publishedAt: t
    .date({ mode: "string"}).notNull(),
});


export const bookGenres = t.pgTable(
  "bookGenres",
  {
    bookId: t.bigint({ mode: "number" }).references(() => books.id, { onDelete: "cascade" }),
    genreId: t.bigint({ mode: "number" }).references(() => genres.id, { onDelete: "cascade" })
  },
  (ta) => [
		t.primaryKey({ columns: [ta.bookId, ta.genreId] })
	]
);

export const bookRelations = relations(books, ({ many }) => ({
  BooktoGenres: many(bookGenres),
}));

export const genreRelations = relations(genres, ({ many }) => ({
  BooktoGenres: many(bookGenres),
}));

export const bookGenresRelations = relations(bookGenres, ({ one }) => ({
  book: one(books, {
    fields: [bookGenres.bookId],
    references: [books.id],
  }),
  genre: one(genres, {
    fields: [bookGenres.genreId],
    references: [genres.id],
  }),
}));