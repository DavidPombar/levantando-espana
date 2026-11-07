"""Regenera las tablas de marcas del README a partir de site/marcas.json.

Uso:  python3 scripts/generar_readme.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATEGORIAS = [
    ("👗", "Moda y complementos"), ("💄", "Cosmética y cuidado personal"), ("🏠", "Hogar y decoración"),
    ("🍷", "Comida y bebida"), ("💍", "Joyería"), ("👟", "Calzado"), ("🧸", "Infantil"),
    ("📚", "Papelería y libros"), ("🐶", "Mascotas"), ("🎁", "Otros"),
]
VACIA = "_Aún no hay marcas aquí. [¿Conoces alguna?](../../issues/new?template=nueva-marca.yml)_"
INICIO, FIN = "<!-- marcas:inicio -->", "<!-- marcas:fin -->"


def ancla(texto):
    return "#-" + re.sub(r"[^\w\- ]", "", texto.lower()).strip().replace(" ", "-")


def main():
    marcas = json.loads((RAIZ / "site/marcas.json").read_text())["marcas"]
    desconocidas = {m["categoria"] for m in marcas} - {c for _, c in CATEGORIAS}
    if desconocidas:
        raise SystemExit(f"Categorías no válidas en marcas.json: {desconocidas}")

    partes = ["## Índice\n"]
    partes += [f"- [{e} {c}]({ancla(c)})" for e, c in CATEGORIAS]
    for emoji, cat in CATEGORIAS:
        partes.append(f"\n## {emoji} {cat}\n")
        filas = sorted((m for m in marcas if m["categoria"] == cat), key=lambda m: m["nombre"].lower())
        if not filas:
            partes.append(VACIA)
            continue
        partes.append("| Marca | Qué hacen | Origen | Precio |\n|---|---|---|---|")
        partes += [f"| [{m['nombre']}]({m['web']}) | {m['descripcion']} | {m['origen']} | {m['precio']} |" for m in filas]

    readme = (RAIZ / "README.md").read_text()
    bloque = f"{INICIO}\n{chr(10).join(partes)}\n{FIN}"
    if INICIO not in readme:
        raise SystemExit("No encuentro los marcadores en README.md")
    readme = re.sub(re.escape(INICIO) + r".*?" + re.escape(FIN), lambda _: bloque, readme, flags=re.S)
    (RAIZ / "README.md").write_text(readme)
    print(f"README actualizado con {len(marcas)} marcas")


if __name__ == "__main__":
    main()
