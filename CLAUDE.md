# Web MDGN (Arquitectura y Construcción)

Sitio estático (HTML + CSS, sin build) publicado con GitHub Pages. El dueño (Javier Mondragón) gestiona la web pidiéndole cambios a Claude en español.

- `index.html`: todo el contenido (secciones: hero, Servicios, Sectores, Proceso, Contacto).
- `styles.css`: estilos. Identidad monocromática negro/blanco, tipografía Archivo ancha (wdth 125, peso 900) como el logo.
- `assets/`: logo e íconos.
- Vista previa local: configuración "web" en `.claude/launch.json` (puerto 8080).

Flujo de cambios: editar → mostrar vista previa → con aprobación del usuario, commit en español y `git push` a `main` (GitHub Pages publica solo).

Reglas de contenido: no inventar proyectos, clientes, cifras ni testimonios; usar solo información entregada por el usuario.
