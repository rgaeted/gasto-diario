# Cloudflare Worker Setup

Este Worker hace proxy de `rgaete.dev/gastos` a la app Heroku.

## Instalación

1. **Accede a Cloudflare Dashboard**
   - Ve a https://dash.cloudflare.com/
   - Selecciona tu dominio `rgaete.dev`

2. **Crea un nuevo Worker**
   - Haz clic en "Workers & Pages" → "Create application"
   - Selecciona "Create Worker"
   - Dale un nombre (ej: `gasto-diario-proxy`)

3. **Copia el código**
   - Abre el Worker editor
   - Reemplaza todo el código con el contenido de `cloudflare-worker.js`
   - Guarda con "Deploy"

4. **Configura la ruta**
   - En "Triggers", configura la ruta:
     - Dominio: `rgaete.dev`
     - Ruta: `example.com/gastos*`
   - Guarda

5. **Verifica**
   - Accede a `https://rgaete.dev/gastos`
   - Debería funcionar igual que en Heroku

## Nota

Si quieres servir la app también en la raíz (`rgaete.dev/`) sin `/gastos`, necesitarás:
- Un segundo Worker que maneje `/`
- O modificar este Worker para servir ambas rutas

Por ahora, solo `rgaete.dev/gastos` funcionará a través de este Worker.
