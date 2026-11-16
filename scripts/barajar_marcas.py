"""Baraja el orden de las marcas en site/marcas.json y elige otra marca de portada.

Se ejecuta cada vez que se añaden marcas, para que todas tengan las mismas
oportunidades de verse arriba del catálogo y en portada.

Uso:  python3 scripts/barajar_marcas.py
"""
import json
import random
from pathlib import Path

RUTA = Path(__file__).resolve().parent.parent / "site/marcas.json"


def main():
    datos = json.loads(RUTA.read_text())
    marcas = datos["marcas"]
    random.shuffle(marcas)

    # Nueva portada al azar, distinta de la actual si hay más de una marca
    candidatas = [m["id"] for m in marcas if m["id"] != datos.get("portada")] or [marcas[0]["id"]]
    datos["portada"] = random.choice(candidatas)

    RUTA.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(marcas)} marcas barajadas · portada: {datos['portada']}")


if __name__ == "__main__":
    main()
