// Fun Assignment, Implement this.
import { Hono } from "hono";
import drizzle  from "../db/drizzle";
import { genres } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const GenresRouter = new Hono();

GenresRouter.get("/", async (c) => {
  const allUsers = await drizzle.select().from(genres);
  return c.json(allUsers);
});

GenresRouter.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await drizzle.query.genres.findFirst({
    where: eq(genres.id, id),
    // with: {
    //   genre: true,
    // },
  });
  if (!result) {
    return c.json({ error: "Genres not found" }, 404);
  }
  return c.json(result);
});

GenresRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
    })
  ),
  async (c) => {
    const { title } = c.req.valid("json");
    const result = await drizzle
      .insert(genres)
      .values({
        title: title,
      })
      .returning();
    return c.json({ success: true, genre: result[0] }, 201);
  }
);

GenresRouter.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1)
    })
  ),
  async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");
    const updated = await drizzle.update(genres).set(data).where(eq(genres.id, id)).returning();
    if (updated.length === 0) {
      return c.json({ error: "Book not found" }, 404);
    }
    return c.json({ success: true, genre: updated[0] });
  }
);

GenresRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await drizzle.delete(genres).where(eq(genres.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ success: true, genre: deleted[0] });
});

export default GenresRouter;