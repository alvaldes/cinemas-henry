export type Cine = {
  value: string;
  label: string;
  nombre: string;
  referencia: string;
  ip: string;
  dominio: string;
  url: string;
  ultracine_id: string;
  latitud: string;
  longitud: string;
  localidad: string;
  provincia: string;
  geofence_notification_radius: string;
  geofence_notification_time_refresh: string;
  ip_privada: string | null;
  ip_api_complejo: string;
  notificaciones: {
    geofence_notification_tittle: string;
    geofence_notification_message: string;
    geofence_notification_imagen: string;
  }[];
};

export type Movie = {
  id: string;
  title: string;
  duration: string;
  genre: string;
  classification: string;
  billboard: string;
  trailer: string;
  director: string;
  actors: string;
  synopsis: string;
  type: string;
  img_primary: string;
  img_secondary?: string;
  releaseDate: string;
};
