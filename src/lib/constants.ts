import type { Cine } from "./types";

export const DEFAULT_CINE_VALUE = "huajuapan";

export const defaultCines: Cine[] = [
	{
		value: "huajuapan",
		label: "Huajuapan",
		nombre: "Henry  Huajuapan",
		referencia: "Cinebox Huajuapan",
		ip: "cnbxhuajuapan.dyndns.org",
		dominio: "https://huajuapan.cinebox.mx",
		url: "http://cnbxhuajuapan.dyndns.org/",
		mapUrl:
			"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3798.716455672841!2d-97.78567254111555!3d17.805018230695666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c601fdd992a0e1%3A0x65f221edbbec8b69!2sHenry%20Cinemas!5e0!3m2!1ses!2smx!4v1781030941734!5m2!1ses!2smx",
		ultracine_id: "4014",
		latitud: "3.387535",
		longitud: "-76.536016",
		localidad: "Cali",
		provincia: "Valle del Cauca",
		geofence_notification_radius: "300",
		geofence_notification_time_refresh: "86400000",
		ip_privada: null,
		ip_api_complejo: "http://cnbxhuajuapan.dyndns.org/apicomplejo",
		notificaciones: [
			{
				geofence_notification_tittle: "Los Mejores Estrenos",
				geofence_notification_message: "¿Vamos al Cine? mira que pelis hay",
				geofence_notification_imagen:
					"http://altoverde.cinesdino.com.ar/resources/images/logo.png",
			},
		],
	},
	{
		value: "lagos",
		label: "Lagos",
		nombre: "Henry  Lagos",
		referencia: "Cinebox Lagos",
		ip: "cnbxlagos.dyndns.org",
		dominio: "https://lagos.cinebox.mx",
		url: "http://cnbxlagos.dyndns.org/",
		mapUrl: "",
		ultracine_id: "4017",
		latitud: "3.387535",
		longitud: "-76.536016",
		localidad: "Cali",
		provincia: "Valle del Cauca",
		geofence_notification_radius: "300",
		geofence_notification_time_refresh: "86400000",
		ip_privada: null,
		ip_api_complejo: "http://cnbxlagos.dyndns.org/apicomplejo",
		notificaciones: [
			{
				geofence_notification_tittle: "Los Mejores Estrenos",
				geofence_notification_message: "¿Vamos al Cine? mira que pelis hay",
				geofence_notification_imagen:
					"http://altoverde.cinesdino.com.ar/resources/images/logo.png",
			},
		],
	},
	{
		value: "juchitan",
		label: "Juchitan",
		nombre: "Henry  Juchitan",
		referencia: "Cinebox Juchitan",
		ip: "cnbxjuchitan.dyndns.org",
		dominio: "https://juchitan.cinebox.mx",
		url: "http://cnbxjuchitan.dyndns.org/",
		mapUrl: "",
		ultracine_id: "4013",
		latitud: "3.387535",
		longitud: "-76.536016",
		localidad: "Cali",
		provincia: "Valle del Cauca",
		geofence_notification_radius: "300",
		geofence_notification_time_refresh: "86400000",
		ip_privada: null,
		ip_api_complejo: "http://cnbxjuchitan.dyndns.org/apicomplejo",
		notificaciones: [
			{
				geofence_notification_tittle: "Cine para 2",
				geofence_notification_message: "El cine renovo la Cartelera",
				geofence_notification_imagen:
					"http://altoverde.cinesdino.com.ar/resources/images/logo.png",
			},
		],
	},
];
