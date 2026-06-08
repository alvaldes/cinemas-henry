import { defineMiddleware } from "astro:middleware";
import { defaultCines, DEFAULT_CINE_VALUE } from "@/lib/constants";

export const onRequest = defineMiddleware(async (context, next) => {
  // Only handle root path
  if (context.url.pathname === "/") {
    // Read selectedCine from cookie, set default if missing
    let cine = context.cookies.get("selectedCine")?.value;

    if (!cine || !defaultCines.some((c) => c.value === cine)) {
      cine = DEFAULT_CINE_VALUE;
      context.cookies.set("selectedCine", cine, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60, // 1 year
      });
    }

    return context.redirect(`/${cine}`);
  }

  return next();
});
