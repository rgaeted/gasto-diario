# gasto-diario

Aplicación de registro de gastos de viaje con almacenamiento persistente en servidor SQLite.

## Qué hay ahora

- El frontend ahora usa un backend Node.js/Express.
- Se agregó un flujo de registro e inicio de sesión simple.
- La información del usuario se guarda en una base de datos SQLite (`data.db`).
- Los perfiles se cargan por nombre de usuario y se recuperan aunque se borren los datos del navegador.

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

Si tienes el Heroku CLI instalado, desde la carpeta del proyecto ejecuta:

```bash
heroku login
heroku create gasto-diario-app
git push heroku main
```

Si prefieres usar el panel de Heroku:

1. Crea una nueva aplicación en https://dashboard.heroku.com/apps
2. Conecta tu repositorio GitHub `rgaeted/gasto-diario`
3. Configura el branch `main`
4. Despliega la app

Heroku usará el `Procfile` y `package.json` para iniciar el servidor en `web: node server.js`.
