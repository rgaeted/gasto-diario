# gasto-diario

Aplicación de registro de gastos de viaje con almacenamiento persistente en servidor SQLite.

## Qué hay ahora

- El frontend ahora usa un backend Node.js/Express.
- Se agregó un flujo de registro e inicio de sesión simple.
- La información del usuario se guarda en una base de datos SQLite (`data.db`) localmente.
- En despliegues de Heroku se puede usar Heroku Postgres con `DATABASE_URL` para que los datos no se pierdan al redeploy.
- Los perfiles se cargan por nombre de usuario y se recuperan aunque se borren los datos del navegador cuando el backend está disponible.

## Cómo ejecutar localmente

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta:

   ```bash
   npm install
   npm start
   ```

3. Abre el navegador en:

   ```
   http://localhost:3000
   ```

## Cómo usar múltiples usuarios

- Escribe un nombre de usuario en el campo `Usuario`.
- Ese perfil guarda su propio viaje y gastos.
- Si borras los datos del navegador, vuelve a escribir el mismo nombre de usuario y los datos se recuperarán desde la base de datos.

## Archivos importantes

- `index.html` — interfaz de la aplicación.
- `server.js` — servidor backend con rutas `/api/profile/:profile`.
- `package.json` — dependencias y comando `npm start`.
- `.gitignore` — ignora `node_modules/` y `data.db`.

## Nota

Esta versión ya no es solo estática en GitHub Pages: necesita un servidor Node.js para el almacenamiento persistente.

## Despliegue en Heroku

Este repositorio ya incluye un workflow de GitHub Actions que puede desplegar la aplicación en Heroku automáticamente cuando hay un push a `main`.

Para activar el despliegue, configura estos secretos en GitHub:

- `HEROKU_API_KEY` — tu API key de Heroku.
- `HEROKU_APP_NAME` — el nombre de la app en Heroku.
- `HEROKU_EMAIL` — el correo de la cuenta de Heroku.

El workflow se encuentra en `.github/workflows/heroku-deploy.yml`.

Si prefieres usar el Heroku CLI manualmente, Heroku usará el `Procfile` y `package.json` para iniciar el servidor con `web: node server.js`.
