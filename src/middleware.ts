import { defineMiddleware } from "astro:middleware";
import { defaultCines } from "@/lib/constants";

const DEFAULT_CINE = "huajuapan";

export const onRequest = defineMiddleware(async (context, next) => {
  // Only handle root path
  if (context.url.pathname === "/") {
    // Read selectedCine from cookie
    const selectedCineCookie = context.cookies.get("selectedCine")?.value;
    let cine = DEFAULT_CINE;

    if (selectedCineCookie) {
      // Validate the cookie value matches a known cine
      const isValid = defaultCines.some((c) => c.value === selectedCineCookie);
      if (isValid) {
        cine = selectedCineCookie;
      }
    }

    return context.redirect(`/${cine}`);
  }

  return next();
});
