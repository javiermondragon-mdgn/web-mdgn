# Web MDGN (Arquitectura y Construcción)

Sitio estático (HTML + CSS, sin build) publicado con GitHub Pages. El dueño (Javier Mondragón) gestiona la web pidiéndole cambios a Claude en español.

- `index.html`: todo el contenido, una sola página con secciones (portada, nosotros, por qué MDGN, cifras, especialidades, servicios, construcción, proceso, gestión de obra, capacidades, trayectoria, proyectos del equipo, obras, clientes, equipo, contacto).
- `styles.css`: estilos. Diseño basado en el brochure corporativo (artifact Slides "MDGN Arquitectura y Construcción — Brochure corporativo", https://claude.ai/artifact/HAyBa7kRCpGAbfVzgZH1oM): grafito #1b1e1c, arena #e7e1d5, crema #f3efe7, terracota #a94a22 / #e0895a; Space Grotesk (títulos) + Public Sans (texto).
- `main.js`: interacciones (header al hacer scroll, menú móvil, apariciones, contadores, línea del proceso). Script clásico sin módulos; el contenido vive en el HTML. Al cambiar CSS/JS, actualizar el `?v=AAAAMMDD` en `index.html`.
- Obras (sección 10): cada proyecto es una ficha `.work` (foto principal, título, línea «tipo · comuna · m²»). Las fotos extra van en `<ul class="work-more" hidden>` con `data-src`/`data-alt`/`data-sub` y aparecen en el carrusel; «Más información» abre su caso en pestaña nueva.
- Páginas internas con URL limpia (carpeta + `index.html`): `design-build/` (página comercial principal) y `obras/<slug>/` (casos: desafío, solución, ficha y galería). Comparten la cabecera con menú completo; las rutas a recursos usan `../` o `../../`.
- Contenido de casos: desafío y solución salen de la descripción entregada por MDGN; no agregar resultados, plazos ni ahorros que no estén verificados. Distinguir siempre obras ejecutadas por MDGN de la experiencia previa del equipo.
- SEO: cada página tiene `<title>`, descripción, canonical y Open Graph propios (URLs absolutas a https://www.mdgn.cl). Al agregar una página, sumarla a `sitemap.xml`.
- Páginas legales: `privacidad.html`, `cookies.html`, `terminos.html`, `datos-personales.html` y `404.html` (mismo diseño; enlazadas en el pie). Los datos pendientes de la empresa van marcados con `<mark class="pendiente">`: no publicar mientras queden marcas.
- Seguridad: cada página tiene una Content-Security-Policy en `<meta>` que solo permite recursos del propio sitio. No agregar scripts inline, `onclick`, CDNs, Google Fonts, analítica ni contenidos insertados (mapas, videos) sin actualizar la CSP y, si usan cookies, la Política de cookies y un aviso de consentimiento.
- Tipografías alojadas en `assets/fonts/` (sin Google Fonts) para no enviar datos de visitantes a terceros. `init.js` reemplaza el antiguo script inline.
- `assets/`: logo (`logo-brochure.png`, crema sobre transparente), `obras/`, `clientes/`, `equipo/`.
- Vista previa local: configuración "web" en `.claude/launch.json` (puerto 8080).

Flujo de cambios: editar → mostrar vista previa → con aprobación del usuario, commit en español y `git push` a `main` (GitHub Pages publica solo).

Reglas de contenido: no inventar proyectos, clientes, cifras ni testimonios; usar solo información entregada por el usuario.

## Dominio
- `www.mdgn.cl` (archivo `CNAME`). Dominio registrado en NIC Chile; DNS administrado en el hosting INC (ns01–ns04.inc.cl).
- El correo es Google Workspace (MX smtp.google.com): nunca tocar registros MX ni TXT al cambiar DNS.
