# Galería Virtual Estudiantil

Abrir `index.html` en el navegador (no necesita servidor).

## Estructura
- `index.html` – inicio de sesión / invitado
- `registro.html` – crear cuenta
- `preferencias.html` – gustos artísticos
- `galeria.html` – galería con búsqueda, filtro y favoritos (`?vista=favoritos`)
- `obra.html?id=N` – detalle, me gusta y comentarios
- `img/obras/` – imágenes de las obras (agregar nuevas aquí y en el arreglo `obras` de `script.js`)

## Nota
Los datos se guardan en `localStorage` (solo en ese navegador). Para Firebase,
reemplazar las funciones de la sección "ALMACENAMIENTO" de `script.js`.
