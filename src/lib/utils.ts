import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Movie, Showtime } from "./types";
import { defaultCines } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate today's date in DD/MM/YYYY format
export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split("/").map(Number); // Divide y convierte a números
  return new Date(year, month - 1, day); // Crea un objeto Date (meses son 0-indexados)
};

export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0); // Ajusta al inicio del día
  return normalized;
};

export async function getMovies(dominio: string, date?: Date): Promise<Movie[] | undefined> {
  if (!dominio) dominio = defaultCines[0].dominio;
  console.log("Dominio: ", dominio);
  const today = date ?? new Date();
  const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  console.log("Formatted Date: ", formattedDate);
  const boundary = "----geckoformboundary788b4c0ac5be0fc287a4463037b16f6";

  const response = await fetch(
    `${dominio}/mobile/consultas/peliculas/PeliculasConFuncionesYHorarios.php`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Sec-GPC": "1",
        Connection: "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        TE: "trailers",
      },
      body: `------geckoformboundary788b4c0ac5be0fc287a4463037b16f6\r\nContent-Disposition: form-data; name="fecha"\r\n\r\n${formattedDate}\r\n------geckoformboundary788b4c0ac5be0fc287a4463037b16f6--\r\n`,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener la información de las películas");
  }

  const htmlText = await response.text();
  let data;
  try {
    data = JSON.parse(htmlText);
  } catch (error) {
    data = null;
  }

  if (!data) return [];

  // Agrupamos las funciones por código de película
  const funcionesMap: Record<string, Showtime[]> = {};

  for (const funcion of data.funciones || []) {
    const showtime: Showtime = {
      id: funcion._id,
      hour: funcion.hora,
      subtitled: funcion.subtitulada === "1",
      format: funcion.formato,
      trasnoche: funcion.trasnoche === "1",
    };

    if (!funcionesMap[funcion.codPelicula]) {
      funcionesMap[funcion.codPelicula] = [];
    }
    funcionesMap[funcion.codPelicula].push(showtime);
  }

  // Convertimos los datos de películas
  const movies: Movie[] = (data.datos || []).map((movie: any) => {
    const images = JSON.parse(movie.peliculas_imagenes);
    const id = movie.peliculas_codigo;

    return {
      id,
      title: movie.peliculas_nombre.toLowerCase(),
      duration: movie.peliculas_duracion,
      genre: movie.peliculas_genero,
      classification: movie.peliculas_clasificacion,
      billboard: movie.peliculas_cartelera,
      trailer: movie.peliculas_trailer,
      director: movie.director,
      actors: movie.actores,
      synopsis: movie.peliculas_sinopsis,
      type: movie.peliculas_tipo,
      img_primary:
        images.find((img: any) => img.tipo === "primario")?.url ?? "",
      img_secondary: images.find((img: any) => img.tipo === "secundario")?.url,
      releaseDate: movie.fecha_estreno,
      showtimes: funcionesMap[id] || [],
    };
  });

  return movies;
}

