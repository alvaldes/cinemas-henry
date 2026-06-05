import type { APIRoute } from "astro";
import { getMovies } from "@/lib/utils";
import { defaultCines } from "@/lib/constants";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const { cine } = params;
  const dateParam = new URL(request.url).searchParams.get("date");

  const dominio = defaultCines.filter((item) => item.value === cine)[0]
    ?.dominio;

  // Parse the date string (YYYY-MM-DD) to a Date object, or use undefined for today
  const date = dateParam ? new Date(dateParam) : undefined;

  const movies = await getMovies(dominio, date);
  return new Response(movies ? JSON.stringify(movies) : "[]");
};
