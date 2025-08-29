import { Hono } from "hono";
import drizzle from "../db/drizzle";
import { books, bookGenres, genres } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { number, z } from "zod";
import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";

const booksRouter = new Hono();

booksRouter.get("/", async (c) => {
  try {
    const allBooks = await drizzle.select({
      id: books.id,
      title: books.title,
      author: books.author,
      publishedAt: books.publishedAt,
      info: books.info,
      summary: books.summary,
      genres: sql<Text>`STRING_AGG(CAST(${bookGenres.genreId} AS TEXT), ', ') as genre_id`
    })
    .from(books)
    .leftJoin(bookGenres, eq(
        bookGenres.bookId,
        books.id
    ))
    .groupBy(books.id);

    return c.json(allBooks);
  } catch (error) {
    console.error("Error fetching books:", error);
    return c.json({ error: error }, 500);
  }
});

booksRouter.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const allBooks = await drizzle.select({
      id: books.id,
      title: books.title,
      author: books.author,
      publishedAt: books.publishedAt,
      info: books.info,
      summary: books.summary,
      genres: sql<Text>`STRING_AGG(CAST(${bookGenres.genreId} AS TEXT), ', ') as genre_id`,
      genresTitle: sql<Text>`STRING_AGG(CAST(${genres.title} AS TEXT), ', ') as genre_title`
    })
    .from(books)
    .leftJoin(bookGenres, eq(
        bookGenres.bookId,
        books.id
    ))
    .leftJoin(genres, eq(
        bookGenres.genreId,
        genres.id
    ))
    .where(eq(books.id, id))
    .groupBy(books.id);

    return c.json(allBooks[0]);
  } catch (error) {
    console.error("Error fetching books:", error);
    return c.json({ error: "Failed to fetch books" }, 500);
  }
});

booksRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      publishedAt: z.string().min(1),
      info: z.string().min(1).nullable(),
      summary: z.string().min(1).nullable(),
      genresId: z.array(z.number()).nullable(),
    })
  ),
  async (c) => {
    const bookData = c.req.valid("json");
    let newBookId;

    try {
      await drizzle.transaction(async (tx) => {
        // 1. Insert หนังสือ
        const newBook = await tx
          .insert(books)
          .values({
            title: bookData.title,
            author: bookData.author,
            info: bookData.info,
            summary: bookData.summary,
            publishedAt: bookData.publishedAt,
          })
          .returning();

        newBookId = newBook[0].id;

        // 2. ถ้ามี genres ให้ insert ลง junction table
        if (bookData.genresId && Array.isArray(bookData.genresId)) {
          for (const genreId of bookData.genresId) {
            await tx.insert(bookGenres).values({
              bookId: newBookId,
              genreId,
            });
          }
        }
      });

      return c.json(
        { success: true, book: bookData, bookid: newBookId },
        201
      );
    } catch (error) {
      console.error("Error adding book:", error);
      return c.json({ error: "Failed to add book" }, 500);
    }
  }
);


booksRouter.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1).optional(),
      author: z.string().min(1).optional(),
      publishedAt: z.string().optional(),
      info: z.string().optional(),
      summary: z.string().optional(),
      genresId: z.array(z.number()).optional(),
    })
  ),
  async (c) => {
    const bookId = Number(c.req.param("id"));
    const data = c.req.valid("json");

    try {
      let updatedBook;
      await drizzle.transaction(async (tx) => {
        // 1. อัปเดตข้อมูลหนังสือ
        const result = await tx.update(books).set({
          title: data.title,
          author: data.author,
          publishedAt: data.publishedAt,
          info: data.info,
          summary: data.summary,
        }).where(eq(books.id, bookId)).returning();

        if (result.length === 0) throw new Error("Book not found");
        updatedBook = result[0];

        // 2. ถ้ามี genresId ให้ลบ BookGenres เก่าทั้งหมด
        if (data.genresId) {
          await tx.delete(bookGenres).where(eq(bookGenres.bookId, bookId));
          // 3. สร้าง BookGenres ใหม่
          for (const genreId of data.genresId) {
            await tx.insert(bookGenres).values({ bookId, genreId });
          }
        }
      });

      return c.json({ success: true, book: updatedBook });
    } catch (err) {
      console.error(err);
      return c.json({ error: err || "Failed to update book" }, 500);
    }
  }
);


booksRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  try {
    const deleted = await drizzle.transaction(async (tx) => {
      // 1. ลบ bookGenres ที่ผูกกับหนังสือเล่มนี้
      await tx.delete(bookGenres).where(eq(bookGenres.bookId, id));

      // 2. ลบ book
      const deletedBook = await tx
        .delete(books)
        .where(eq(books.id, id))
        .returning();

      return deletedBook;
    });

    if (deleted.length === 0) {
      return c.json({ error: "Book not found" }, 404);
    }

    return c.json({ success: true, book: deleted[0] });
  } catch (error) {
    console.error("Error deleting book:", error);
    return c.json({ error: "Failed to delete book" }, 500);
  }
});


export default booksRouter;