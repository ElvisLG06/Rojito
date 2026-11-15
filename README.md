# Rojito

Historial del carro de la familia: cambios de aceite, llantas, revisión técnica, SOAT, mantenimientos, reparaciones y más, con fotos y avisos de lo próximo.

- Web estática publicada con **GitHub Pages** (sin compilación: HTML, CSS y JavaScript).
- Datos y fotos en **Supabase** (plan gratis).
- Sin usuarios ni contraseñas: se entra con el **link familiar** (`…/#k=CLAVE`). Cada celular recuerda la clave y el nombre de quien lo usa.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `css/app.css` | La página y sus estilos |
| `js/app.js` | Pantallas, formularios, fotos y avisos de "Próximos" |
| `js/datos.js` | Conexión con Supabase (y modo demo local) |
| `js/config.js` | URL y clave pública de Supabase (vacías = modo demo) |
| `supabase/schema.sql` | Script para crear la tabla, las reglas de acceso y el espacio de fotos |
| `.github/workflows/mantener-activo.yml` | Tarea cada 3 días para que Supabase no pause el proyecto |

## Puesta en marcha

1. En Supabase, crear un proyecto nuevo.
2. En **SQL Editor**, pegar y ejecutar `supabase/schema.sql`.
3. En el mismo editor, guardar la clave familiar (no se sube a GitHub):
   ```sql
   delete from private.config;
   insert into private.config (clave) values ('LA_CLAVE_FAMILIAR');
   ```
4. En **Project Settings → API**, copiar la *Project URL* y la *anon public key* a `js/config.js`.
5. En GitHub: **Settings → Pages → Deploy from a branch → main / (root)**.
6. Compartir con la familia: `https://elvislg06.github.io/Rojito/#k=LA_CLAVE_FAMILIAR`.

Para cambiar la clave (por ejemplo, si el link llegó a quien no debía): repetir el paso 3 con una clave nueva y volver a compartir el link.

## Agregar un tipo de registro

En `js/app.js`, agregar una entrada en `TIPOS` con su nombre, ícono, descripción y campos (`texto`, `numero`, `fecha`, `select`, `opciones`, `textarea`). No hace falta cambiar la base de datos: los campos propios de cada tipo se guardan en la columna `datos`.
