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

// Format duration in minutes to "Xh Ymin" format
export const formatDuration = (minutes: number | string): string => {
	const totalMinutes = Number(minutes);
	if (isNaN(totalMinutes) || totalMinutes <= 0) return "";

	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;

	if (hours === 0) return `${mins} min`;
	if (mins === 0) return `${hours}h`;
	return `${hours}h ${mins}min`;
};

// Convert 24h time string (e.g. "16:30") to 12h AM/PM format (e.g. "4:30 PM")
export const formatToAmPm = (hour: string): string => {
	const [h, m] = hour.split(":").map(Number);
	if (isNaN(h) || isNaN(m)) return hour;

	const period = h >= 12 ? "PM" : "AM";
	const hour12 = h % 12 || 12;

	return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
};

// Capitalize the first letter of each word (like CSS text-transform: capitalize)
export const titleCase = (str: string): string => {
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export async function getMovies(
	dominio: string,
	date?: Date,
	retries = 3,
): Promise<Movie[] | undefined> {
	if (!dominio) dominio = defaultCines[0].dominio;
	const today = date ?? new Date();
	const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

	const formData = new FormData();
	formData.append("fecha", formattedDate);

	try {
		const response = await fetch(
			`${dominio}/mobile/consultas/peliculas/PeliculasConFuncionesYHorarios.php`,
			{
				method: "POST",
				body: formData,
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
			let images: any[] = [];
			try {
				images =
					typeof movie.peliculas_imagenes === "string"
						? JSON.parse(movie.peliculas_imagenes)
						: movie.peliculas_imagenes || [];
			} catch (e) {
				console.error(
					`Error parsing images for movie ${movie.peliculas_codigo}:`,
					e,
				);
			}

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
				img_primary: Array.isArray(images)
					? (images.find((img: any) => img.tipo === "primario")?.url ?? "")
					: "",
				img_secondary: Array.isArray(images)
					? images.find((img: any) => img.tipo === "secundario")?.url
					: undefined,
				releaseDate: movie.fecha_estreno,
				showtimes: funcionesMap[id] || [],
			};
		});

		return movies;
	} catch (error) {
		if (retries > 0) {
			await new Promise((res) => setTimeout(res, 1000)); // Wait 1 second before retrying
			return getMovies(dominio, date, retries - 1);
		} else {
			console.error("Fetching movies failed after multiple retries:", error);
			return undefined;
		}
	}
}

export function searchMovies(movies: Movie[], query: string): Movie[] {
	const q = query.toLowerCase().trim();
	if (!q) return [];

	const matchesTitle: Movie[] = [];
	const matchesOther: Movie[] = [];

	for (const movie of movies) {
		const title = (movie.title ?? '').toLowerCase();
		const genre = (movie.genre ?? '').toLowerCase();
		const director = (movie.director ?? '').toLowerCase();
		const actors = (movie.actors ?? '');

		const inTitle = title.includes(q);
		const inGenre = genre.includes(q);
		const inDirector = director.includes(q);
		const inActors = actors
			.split(',')
			.some((a: string) => a.trim().toLowerCase().includes(q));

		if (inTitle || inGenre || inDirector || inActors) {
			(inTitle ? matchesTitle : matchesOther).push(movie);
		}
	}

	return [...matchesTitle, ...matchesOther];
}
