# Cómo añadir una marca

¡Gracias por sumar! Para que el directorio siga siendo útil:

## Requisitos

- **Marca española**: fundada en España y con equipo aquí.
- **Emergente o independiente**: nada de grandes grupos ni marcas de un gran conglomerado.
- **Vende online o tiene tienda física** donde se pueda comprar ya.
- Puedes proponer tu propia marca, pero dilo en el PR. 🙂

## ¿Solo quieres proponerla?

Usa el formulario «Proponer una marca» de la web, o abre un issue con la plantilla **Nueva marca**. Con el nombre y la web basta.

## Añadirla tú con un Pull Request

Todas las marcas viven en [`site/marcas.json`](site/marcas.json): de ahí salen la web y las tablas del README.

1. Añade una entrada a `site/marcas.json`:

   ```json
   {
     "id": "nombre-de-la-marca",
     "nombre": "Nombre de la Marca",
     "web": "https://web.com",
     "categoria": "Hogar y decoración",
     "descripcion": "Qué hacen, en 12 palabras como mucho",
     "origen": "Ciudad, Provincia",
     "precio": "€€",
     "imagen": "img/nombre-de-la-marca.jpg"
   }
   ```

   - **categoria**: Moda y complementos, Cosmética y cuidado personal, Hogar y decoración, Comida y bebida, Joyería, Calzado, Infantil, Papelería y libros, Mascotas u Otros.
   - **precio**: `€` hasta 30 € · `€€` 30–80 € · `€€€` más de 80 € (precio típico de un regalo).
   - **ancha** (opcional, `true`): la ficha ocupa dos columnas. Úsalo con fotos apaisadas.

2. Añade una foto del producto en `site/img/` (JPG, máximo 900 px de lado y unos 150 KB), con permiso de la marca.
3. Regenera el README: `python3 scripts/generar_readme.py`
4. Sin enlaces de afiliado ni parámetros de tracking. Una marca por PR, por favor.
