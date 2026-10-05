# Flights

Registro personal de vuelos con mapa de rutas y estadísticas. Es una sola página (`index.html`) sin servidor.

## Privacidad

- Esta página **no contiene ni envía datos de vuelos**. Los vuelos se guardan solo en el navegador de quien la abre (almacenamiento local del navegador).
- Cada persona que abra la página ve su propia bitácora vacía; nadie puede ver la tuya.
- Las copias (`Exportar`) se descargan a tu dispositivo. No las subas al repositorio: el `.gitignore` bloquea los archivos `.json`, `.txt` y `.csv`.

## Uso

1. Abrí la página y tocá **Importar archivo .json** para cargar una copia exportada.
2. Agregá vuelos con **Agregar vuelo** (códigos IATA de origen y destino, fecha y horarios).
3. Exportá de vez en cuando para tener una copia: si borrás los datos del navegador, se pierden.

## Créditos

- Imágenes de la Tierra (satélite y noche): texturas de los ejemplos de three.js (MIT), basadas en imágenes de la NASA.
- Banderas: flag-icons (MIT).
