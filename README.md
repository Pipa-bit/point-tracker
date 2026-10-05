# Point Tracker

Web para contar los puntos en las carreras de puntuación de patinaje de velocidad, pensada para usarse a pie de pista desde una tablet o un móvil, incluso sin conexión.

## Desarrollo

```bash
npm install     # instala las dependencias
npm run dev     # arranca la web en local con recarga automática
npm run build   # comprueba los tipos y genera la versión final en dist/
npm test        # ejecuta los tests de la lógica de puntos
```

Cada vez que se sube código a `main`, GitHub Actions pasa los tests y, si van bien, la publica en GitHub Pages.
