import app from "./app.js";
import { logger } from "./lib/logger.js";

export default app;

const rawPort = process.env["PORT"];

if (rawPort) {
  const port = Number(rawPort);
  if (!Number.isNaN(port) && port > 0) {
    // @ts-ignore
    app.listen(port, (err: any) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  }
}
