/* MDGN — marca la página como "con JS" antes de pintarla, para que las animaciones de aparición funcionen.
   Si main.js no llega a cargar, a los 4 s se quita la marca y todo el contenido queda visible. */
document.documentElement.classList.add("js");
setTimeout(function () { if (!window.__MDGN__) document.documentElement.classList.remove("js"); }, 4000);
