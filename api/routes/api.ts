import { Hono } from "hono";
import booksRouter from "./books.js";
import genresRotues from "./genre.js"
import bookGenresRouter from "./bookgenres.js";

const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({ message: "Book Store API" });
});

apiRouter.route("/books", booksRouter);
apiRouter.route("/genres", genresRotues);
apiRouter.route("/bookgenres", bookGenresRouter);

export default apiRouter;
