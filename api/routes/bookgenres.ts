// Fun Assignment, Implement this.
import { Hono } from "hono";
import drizzle from "../db/drizzle";
import { bookGenres } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const bookGenresRouter = new Hono();

bookGenresRouter.get("/", async (c) => {
  const allUsers = await drizzle.select().from(bookGenres);
  return c.json(allUsers);
});

bookGenresRouter.get("/:bookId/:genreId", async (c) => {
  const bookId = Number(c.req.param("bookId"));
  const genreId = Number(c.req.param("genreId"));
  const result = await drizzle.query.bookGenres.findFirst({
    where: and (eq(bookGenres.bookId  , bookId),eq(bookGenres.genreId  , genreId)),
    // with: {
    //   genre: true,
    // },
  });
  if (!result) {
    return c.json({ error: "bookGenres not found" }, 404);
  }
  return c.json(result);
});

bookGenresRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      bookId: z.number().int(),
      genreId: z.number().int(),
    })
  ),
  async (c) => {
    const { bookId, genreId } = c.req.valid("json");
    const result = await drizzle
      .insert(bookGenres)
      .values({
        bookId: bookId,
        genreId: genreId,
      })
      .returning();
    return c.json({ success: true, genre: result[0] }, 201);
  }
);

bookGenresRouter.patch(
  "/:bookId/:genreId",
  zValidator(
    "json",
    z.object({
      bookId: z.number().int(),
      genreId: z.number().int(),
    })
  ),
  async (c) => {
    const bookId = Number(c.req.param("bookId"));
    const genreId = Number(c.req.param("genreId"));
    const data = c.req.valid("json");
    const updated = await drizzle.update(bookGenres).set(data).where(and (eq(bookGenres.bookId  , bookId),eq(bookGenres.genreId  , genreId))).returning();
    if (updated.length === 0) {
      return c.json({ error: "Book not found" }, 404);
    }
    return c.json({ success: true, genre: updated[0] });
  }
);

bookGenresRouter.delete("/:bookId/all", async (c) => {
  const bookId = Number(c.req.param("bookId"));
  if (isNaN(bookId)) {
    return c.json({ error: "Invalid bookId" }, 400);
  }
  const deleted = await drizzle.delete(bookGenres).where(eq(bookGenres.bookId, bookId)).returning();
  return c.json({ success: true, deletedCount: deleted.length, genres: deleted });
});

bookGenresRouter.delete("/:bookId/:genreId", async (c) => {
  const bookId = Number(c.req.param("bookId"));
  const genreId = Number(c.req.param("genreId"));
  const deleted = await drizzle.delete(bookGenres).where(and (eq(bookGenres.bookId  , bookId),eq(bookGenres.genreId  , genreId))).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ success: true, genre: deleted[0] });
});


export default bookGenresRouter;