import * as Sentry from "@sentry/node";
import { SENTRY_DSN } from "./config/index.js";

Sentry.init({
  dsn: SENTRY_DSN ,
  sendDefaultPii: true,
});