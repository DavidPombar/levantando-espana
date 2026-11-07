"""Valida la salida de la investigación e inserta las marcas en README.md.

Lee el JSON de la variable de entorno RESULT y escribe:
  README.md   actualizado
  title.txt   título de la PR
  pr.md       cuerpo de la PR
  comment.md  comentario para el issue
y la salida `added` (número de marcas añadidas) en $GITHUB_OUTPUT.
"""
import json, os, re, sys
from urllib.parse import urlparse

CATEGORIES = ["Moda y complementos", "Cosmética y cuidado personal", "Hogar y decoración",
              "Comida y bebida", "Joyería", "Calzado", "Infantil", "Papelería y libros",
              "Mascotas", "Otros"]
PRICES = {"€", "€€", "€€€"}
HEADER = "| Marca | Qué hacen | Origen | Precio |\n|---|---|---|---|\n"
URL_RE = re.compile(r"^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^\s|()<>\[\]`\"']*)?$")


def clean(text, limit):
    """Texto plano en una línea, sin nada que rompa la tabla o inyecte Markdown/HTML."""
    text = re.sub(r"[\r\n\t]+", " ", str(text))
    text = re.sub(r"[|<>\[\]`*_#\\]", "", text)
    return re.sub(r"\s+", " ", text).strip()[:limit]


def domain(url):
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host


def main():
    data = json.loads(os.environ["RESULT"])
    readme = open("README.md", encoding="utf-8").read()
    existing = {domain(u) for u in re.findall(r"\]\((https?://[^)]+)\)", readme)}

    added, rejected = [], [(clean(r.get("name", "?"), 60), clean(r.get("reason", ""), 300))
                           for r in data.get("rejected", [])[:10]]

    for b in data.get("brands", [])[:10]:
        name = clean(b.get("name", ""), 60)
        url = str(b.get("url", "")).strip()
        cat, price = b.get("category"), b.get("price")
        if not name or not URL_RE.match(url) or cat not in CATEGORIES or price not in PRICES:
            rejected.append((name or "?", "Los datos de la investigación no son válidos."))
            continue
        if domain(url) in existing:
            rejected.append((name, "Ya está en el directorio."))
            continue
        row = (f"| [{name}]({url}) | {clean(b.get('description', ''), 110)} | "
               f"{clean(b.get('origin', 'España'), 60) or 'España'} | {price} |")
        readme = insert(readme, cat, name, row)
        existing.add(domain(url))
        added.append((name, url, cat, clean(b.get("notes", ""), 400)))

    open("README.md", "w", encoding="utf-8").write(readme)

    names = ", ".join(a[0] for a in added)
    open("title.txt", "w").write(f"Nueva marca: {names}"[:100] + "\n")

    pr = ["## Marcas investigadas\n"]
    for name, url, cat, notes in added:
        pr.append(f"- **{name}** ({cat}) — {url}" + (f"\n  - Notas: {notes}" if notes else ""))
    if rejected:
        pr.append("\n## Descartadas\n")
        pr += [f"- **{n}**: {r}" for n, r in rejected]
    pr.append(f"\n**Resumen:** {clean(data.get('summary', ''), 500)}")
    pr.append("\n> Investigado automáticamente. Revisa las notas antes de aprobar.")
    open("pr.md", "w").write("\n".join(pr))

    if added:
        msg = (f"¡Gracias! 🙌 He investigado la propuesta y he abierto una PR con: **{names}**. "
               "Se publicará cuando el mantenedor la apruebe.")
    else:
        msg = "¡Gracias por la propuesta! 🙏 Esta vez no hemos podido añadirla:"
    if rejected:
        msg += "\n\n" + "\n".join(f"- **{n}**: {r}" for n, r in rejected)
    open("comment.md", "w").write(msg)

    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as f:
        f.write(f"added={len(added)}\n")
    print(f"Añadidas: {len(added)} · Descartadas: {len(rejected)}")


def insert(readme, category, name, row):
    m = re.search(rf"^## [^\n]*{re.escape(category)}\n\n(.*?)(?=\n## |\n---)", readme, re.S | re.M)
    if not m:
        sys.exit(f"No encuentro la sección {category}")
    body = m.group(1)
    rows = [l for l in body.splitlines() if l.startswith("| [")]
    rows.append(row)
    rows.sort(key=lambda l: l[3:].lower())
    new_body = HEADER + "\n".join(rows) + "\n"
    return readme[:m.start(1)] + new_body + readme[m.end(1):]


if __name__ == "__main__":
    main()
