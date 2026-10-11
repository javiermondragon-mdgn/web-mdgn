# Web MDGN (Arquitectura y Construcción)

Sitio estático (HTML + CSS, sin build) publicado con GitHub Pages. El dueño (Javier Mondragón) gestiona la web pidiéndole cambios a Claude en español.

- `index.html`: todo el contenido, una sola página con secciones (portada, nosotros, por qué MDGN, cifras, especialidades, servicios, construcción, proceso, gestión de obra, capacidades, trayectoria, proyectos del equipo, obras, clientes, equipo, contacto).
- `styles.css`: estilos. Diseño basado en el brochure corporativo (artifact Slides "MDGN Arquitectura y Construcción — Brochure corporativo", https://claude.ai/artifact/HAyBa7kRCpGAbfVzgZH1oM): grafito #1b1e1c, arena #e7e1d5, crema #f3efe7, terracota #a94a22 / #e0895a; Space Grotesk (títulos) + Public Sans (texto).
- `main.js`: interacciones (header al hacer scroll, menú móvil, apariciones, contadores, línea del proceso). Script clásico sin módulos; el contenido vive en el HTML. Al cambiar CSS/JS, actualizar el `?v=AAAAMMDD` en `index.html`.
- `assets/`: logo (`logo-brochure.png`, crema sobre transparente), `obras/`, `clientes/`, `equipo/`.
- Vista previa local: configuración "web" en `.claude/launch.json` (puerto 8080).

Flujo de cambios: editar → mostrar vista previa → con aprobación del usuario, commit en español y `git push` a `main` (GitHub Pages publica solo).

Reglas de contenido: no inventar proyectos, clientes, cifras ni testimonios; usar solo información entregada por el usuario.

## Dominio
- `www.mdgn.cl` (archivo `CNAME`). Dominio registrado en NIC Chile; DNS administrado en el hosting INC (ns01–ns04.inc.cl).
- El correo es Google Workspace (MX smtp.google.com): nunca tocar registros MX ni TXT al cambiar DNS.
