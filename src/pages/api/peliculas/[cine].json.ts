import type { APIRoute } from "astro";
import { getMovies } from "@/lib/utils";
import { defaultCines } from "@/lib/constants";

export const GET: APIRoute = async ({ params, request }) => {
  const { cine } = params;
  const date = new URL(request.url).searchParams.get('date');
  console.log("Date: ", date);

  const dominio = defaultCines.filter((item) => item.value === cine)[0]?.dominio;
  console.log("Dominio .json: ", dominio);

  const movies = await getMovies(dominio);
  return new Response(movies ? JSON.stringify(movies) : "[]");
};

export function getStaticPaths() {
  return defaultCines
    .map((item) => ({
      params: { cine: item.value.toLowerCase() },
    }))
}
