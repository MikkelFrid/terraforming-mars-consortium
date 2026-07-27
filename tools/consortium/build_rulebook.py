#!/usr/bin/env python3
"""Generate assets/consortium/rulebook.html with Consortium art + card index.

Run from repo root after cards.json is up to date:
  python3 tools/consortium/build_rulebook.py
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[2]
CARDS_JSON = ROOT / "src/genfiles/cards.json"
OUT = ROOT / "assets/consortium/rulebook.html"

# Cards whose genfile metadata.description is empty.
DESCRIPTION_FALLBACKS = {
    "Core Sampling:SP": (
        "Spend 6 M€ to gain 1 iridium from the bank (if any remains)."
    ),
}

TYPE_TIP_CLASS = {
    "corporation": "tip-corp",
    "prelude": "tip-prelude",
    "standard_project": "tip-sp",
    "active": "tip-active",
    "automated": "tip-automated",
    "event": "tip-event",
}

TYPE_ORDER = {
    "corporation": 0,
    "prelude": 1,
    "standard_project": 2,
    "active": 3,
    "automated": 4,
    "event": 5,
}

TYPE_LABEL = {
    "corporation": "Corporation",
    "prelude": "Prelude",
    "standard_project": "Standard project",
    "active": "Active",
    "automated": "Automated",
    "event": "Event",
}

MEGASTRUCTURES = [
    ("bridge-0.png", "Bridge (Sector 0)", "Always in play. Completing it unlocks frontier sector 0."),
    ("bridge-1.png", "Bridge (Sector 1)", "Always in play. Completing it unlocks frontier sector 1."),
    ("bridge-2.png", "Bridge (Sector 2)", "Always in play. Completing it unlocks frontier sector 2."),
    ("space_elevator.png", "Space Elevator", "Grand structure (2 of 5 drawn per game). Highland foundation for first contribution."),
    ("l1_magnetic_shield.png", "L1 Magnetic Shield", "Grand structure pool. No foundation gate."),
    ("mohole.png", "Mohole", "Grand structure pool. Highland foundation for first contribution."),
    ("solar_mirror.png", "Solar Mirror", "Grand structure pool. Highland foundation for first contribution."),
    ("arcology.png", "Arcology", "Grand structure pool. No foundation gate."),
]


def load_consortium_cards() -> list[dict]:
    data = json.loads(CARDS_JSON.read_text(encoding="utf-8"))
    cards = [c for c in data if c.get("module") == "consortium"]

    def sort_key(c: dict) -> tuple:
        md = c.get("metadata") or {}
        num = md.get("cardNumber") or ""
        # CN01 / CNC1 / empty → numeric-ish order with corps first among letters
        m = re.match(r"^CN([A-Z]?)(\d+)$", num)
        if m:
            letter, digits = m.group(1), int(m.group(2))
            letter_rank = 0 if letter == "" else 1 if letter == "C" else 2
            return (letter_rank, digits, c.get("name", ""))
        return (9, 999, c.get("name", ""))

    cards.sort(key=sort_key)
    return cards


def cost_cell(c: dict) -> str:
    if c.get("type") == "corporation":
        # Starting M€ is not always in genfile top-level; corporations use startingMegaCredits when present
        sm = c.get("startingMegaCredits")
        return f"{sm} M€ start" if sm is not None else "Corp"
    if c.get("type") == "prelude":
        return "—"
    cost = c.get("cost")
    return "—" if cost is None else f"{cost}"


def tags_cell(c: dict) -> str:
    tags = c.get("tags") or []
    if not tags:
        return "—"
    return ", ".join(t.replace("_", " ") for t in tags)


def card_number(c: dict) -> str:
    md = c.get("metadata") or {}
    return md.get("cardNumber") or "—"


def card_description(c: dict) -> str:
    md = c.get("metadata") or {}
    desc = md.get("description")
    if desc:
        return desc
    return DESCRIPTION_FALLBACKS.get(c.get("name", ""), "—")


def gallery_url(name: str) -> str:
    """CardList reads filter text from the URL hash, not ?search=."""
    return "/cards#" + quote(name, safe="")


def tip_cost_label(c: dict) -> str:
    if c.get("type") == "corporation":
        sm = c.get("startingMegaCredits")
        return f"{sm}" if sm is not None else "—"
    if c.get("type") == "prelude":
        return "P"
    cost = c.get("cost")
    return "—" if cost is None else str(cost)


def tip_tags_html(c: dict) -> str:
    tags = c.get("tags") or []
    if not tags:
        return '<span class="tip-no-tags">No tags</span>'
    parts = []
    for tag in tags:
        src = f"/assets/tags/{tag}.png"
        alt = html.escape(tag.replace("_", " "))
        parts.append(
            f'<img class="tip-tag" src="{src}" alt="{alt}" title="{alt}" '
            f'width="28" height="28" />'
        )
    return "".join(parts)


def tip_vp_html(c: dict) -> str:
    md = c.get("metadata") or {}
    vp = c.get("victoryPoints")
    if vp is None:
        vp = md.get("victoryPoints")
    if vp is None or vp == 0:
        return ""
    return f'<span class="tip-vp">{html.escape(str(vp))} VP</span>'


def card_tooltip_html(c: dict) -> str:
    name = c.get("name", "")
    ctype = c.get("type", "")
    tip_class = TYPE_TIP_CLASS.get(ctype, "tip-automated")
    type_label = TYPE_LABEL.get(ctype, ctype)
    desc = card_description(c)
    num = card_number(c)
    cost = tip_cost_label(c)
    cost_caption = "start" if ctype == "corporation" else "M€"
    return (
        f'<span class="card-tip {tip_class}" role="tooltip">'
        f'<span class="tip-top">'
        f'<span class="tip-cost" title="{html.escape(cost_caption)}">'
        f"{html.escape(cost)}</span>"
        f'<span class="tip-title">{html.escape(name)}</span>'
        f"{tip_vp_html(c)}"
        f"</span>"
        f'<span class="tip-tags">{tip_tags_html(c)}</span>'
        f'<span class="tip-body">{html.escape(desc)}</span>'
        f'<span class="tip-foot">'
        f'<span class="tip-type">{html.escape(type_label)}</span>'
        f'<span class="tip-num">{html.escape(num)}</span>'
        f'<span class="tip-mod">Consortium</span>'
        f"</span>"
        f'<span class="tip-hint">Click to open in card gallery</span>'
        f"</span>"
    )


def catalog_rows(cards: list[dict]) -> str:
    rows = []
    for c in cards:
        name = c.get("name", "")
        name_esc = html.escape(name)
        ctype = TYPE_LABEL.get(c.get("type", ""), c.get("type", ""))
        desc = html.escape(card_description(c))
        num = html.escape(card_number(c))
        href = html.escape(gallery_url(name), quote=True)
        tip = card_tooltip_html(c)
        rows.append(
            "<tr>"
            f'<td class="num">{num}</td>'
            f'<td class="name">'
            f'<a class="card-link" href="{href}" target="_blank" '
            f'rel="noopener">{name_esc}{tip}</a>'
            f"</td>"
            f"<td>{html.escape(ctype)}</td>"
            f'<td class="cost">{html.escape(cost_cell(c))}</td>'
            f"<td>{html.escape(tags_cell(c))}</td>"
            f'<td class="desc">{desc}</td>'
            "</tr>"
        )
    return "\n".join(rows)


def mega_cards_html() -> str:
    parts = []
    for filename, title, blurb in MEGASTRUCTURES:
        parts.append(
            "<div class=\"mega-card\">"
            f"<img src=\"/assets/consortium/megastructures/{filename}\" "
            f"alt=\"{html.escape(title)}\" width=\"116\" height=\"116\" />"
            f"<strong>{html.escape(title)}</strong>"
            f"{html.escape(blurb)}"
            "</div>"
        )
    return "\n".join(parts)


def build_html(cards: list[dict]) -> str:
    n = len(cards)
    catalog = catalog_rows(cards)
    megas = mega_cards_html()
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Consortium — Player Rulebook</title>
  <style>
    :root {{
      --ink: #1a2430;
      --muted: #4a5a6a;
      --line: #c8d2dc;
      --panel: #f4f7fa;
      --accent: #2f6f8f;
      --accent-soft: #e8f2f7;
      --warn: #8a4b12;
      --warn-bg: #fff6e8;
      --ok: #1f6b3a;
      --ok-bg: #eaf7ef;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      color: var(--ink);
      font: 16px/1.55 Georgia, "Times New Roman", serif;
      background: #eef2f5;
    }}
    .wrap {{
      max-width: 56rem;
      margin: 0 auto;
      padding: 1.25rem 1.25rem 3rem;
      background: #fff;
      box-shadow: 0 0 0 1px var(--line);
    }}
    header.hero {{
      margin: -1.25rem -1.25rem 1.5rem;
      position: relative;
      min-height: 240px;
      background: #1a2430 center/cover no-repeat;
      background-image: linear-gradient(180deg, rgba(12,20,28,.3), rgba(12,20,28,.85)),
        url("/assets/board/mars_consortium.png");
      color: #f4f7fa;
      padding: 1.75rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: .35rem;
    }}
    header.hero .brand-row {{
      display: flex;
      align-items: center;
      gap: .85rem;
    }}
    header.hero .brand-row img.exp {{
      width: 56px;
      height: 56px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,.4));
    }}
    header.hero h1 {{
      margin: 0;
      font: 700 1.9rem/1.15 system-ui, -apple-system, sans-serif;
      letter-spacing: .02em;
    }}
    header.hero p {{
      margin: 0;
      max-width: 36rem;
      color: #d7e2ec;
      font: 15px/1.45 system-ui, -apple-system, sans-serif;
    }}
    .meta {{
      color: var(--muted);
      font: 14px/1.4 system-ui, -apple-system, sans-serif;
      margin: 0 0 1.25rem;
    }}
    nav.toc {{
      background: var(--panel);
      border: 1px solid var(--line);
      padding: .75rem 1rem;
      margin: 0 0 1.75rem;
      font: 14px/1.5 system-ui, -apple-system, sans-serif;
    }}
    nav.toc strong {{ display: block; margin-bottom: .35rem; }}
    nav.toc a {{ color: var(--accent); text-decoration: none; margin-right: .75rem; }}
    nav.toc a:hover {{ text-decoration: underline; }}
    h2 {{
      font: 700 1.25rem/1.25 system-ui, -apple-system, sans-serif;
      margin: 2rem 0 .75rem;
      padding-top: .5rem;
      border-top: 2px solid var(--line);
      color: var(--accent);
    }}
    h3 {{
      font: 700 1.05rem/1.3 system-ui, -apple-system, sans-serif;
      margin: 1.25rem 0 .5rem;
    }}
    p, li {{ margin: 0 0 .65rem; }}
    ul, ol {{ padding-left: 1.25rem; margin: 0 0 .85rem; }}
    .callout {{
      border-left: 4px solid var(--accent);
      background: var(--accent-soft);
      padding: .75rem 1rem;
      margin: 1rem 0;
      font: 15px/1.45 system-ui, -apple-system, sans-serif;
    }}
    .callout.warn {{ border-color: var(--warn); background: var(--warn-bg); }}
    .callout.ok {{ border-color: var(--ok); background: var(--ok-bg); }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: .75rem 0 1.25rem;
      font: 14px/1.4 system-ui, -apple-system, sans-serif;
    }}
    th, td {{
      border: 1px solid var(--line);
      padding: .45rem .55rem;
      text-align: left;
      vertical-align: top;
    }}
    th {{ background: var(--panel); }}
    code {{
      font: 13px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: var(--panel);
      padding: .1rem .3rem;
    }}
    .icon-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 1rem 0;
      font: 14px/1.35 system-ui, -apple-system, sans-serif;
    }}
    .icon-card {{
      flex: 1 1 140px;
      max-width: 180px;
      text-align: center;
      background: var(--panel);
      border: 1px solid var(--line);
      padding: .65rem .5rem;
    }}
    .icon-card img {{
      display: block;
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin: 0 auto .4rem;
    }}
    .mega-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: .75rem;
      margin: 1rem 0;
    }}
    .mega-card {{
      border: 1px solid var(--line);
      background: #0e1620;
      color: #c5d0da;
      padding: .55rem;
      text-align: center;
      font: 12px/1.35 system-ui, -apple-system, sans-serif;
    }}
    .mega-card img {{
      width: 96px;
      height: 96px;
      object-fit: contain;
      display: block;
      margin: 0 auto .4rem;
    }}
    .mega-card strong {{ display: block; margin-bottom: .2rem; color: #fff; font-size: 13px; }}
    .board-figure {{
      margin: 1rem 0;
      border: 1px solid var(--line);
      background: #0e1620;
      padding: .5rem;
    }}
    .board-figure img {{
      width: 100%;
      height: auto;
      display: block;
    }}
    .board-figure figcaption {{
      font: 13px/1.35 system-ui, -apple-system, sans-serif;
      color: #c5d0da;
      padding: .5rem .25rem 0;
    }}
    .map-gallery {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin: 1rem 0 1.25rem;
    }}
    @media (min-width: 720px) {{
      .map-gallery {{ grid-template-columns: 1fr 1fr 1fr; }}
    }}
    .map-card {{
      border: 1px solid var(--line);
      background: #0e1620;
      overflow: hidden;
    }}
    .map-card img {{
      width: 100%;
      height: auto;
      display: block;
      background: #000;
    }}
    .map-card .map-body {{
      padding: .65rem .7rem .75rem;
      font: 13px/1.4 system-ui, -apple-system, sans-serif;
      color: #c5d0da;
    }}
    .map-card .map-body strong {{
      display: block;
      color: #fff;
      font-size: 14px;
      margin-bottom: .25rem;
    }}
    .map-card .map-stats {{
      margin: .4rem 0 0;
      color: #8a97a6;
      font-size: 12px;
    }}
    .terrain {{
      display: inline-block;
      width: .85rem;
      height: .85rem;
      border: 1px solid #333;
      vertical-align: -1px;
      margin-right: .25rem;
    }}
    .t-chasm {{ background: #2a2a2a; }}
    .t-crater {{ background: #c45c26; }}
    .t-highland {{ background: #6b8f71; }}
    .t-frontier {{ background: #7a6bb0; }}
    footer {{
      margin-top: 2.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font: 13px/1.4 system-ui, -apple-system, sans-serif;
    }}
    a {{ color: var(--accent); }}
    .catalog-note {{
      font: 14px/1.4 system-ui, -apple-system, sans-serif;
      color: var(--muted);
      margin-bottom: .75rem;
    }}
    .catalog-wrap {{ overflow-x: auto; }}
    #catalog table {{ font-size: 13px; }}
    #catalog td.num {{ white-space: nowrap; font-weight: 600; width: 3.5rem; }}
    #catalog td.name {{ white-space: nowrap; font-weight: 600; }}
    #catalog td.cost {{ white-space: nowrap; }}
    #catalog td.desc {{ min-width: 14rem; color: var(--muted); }}
    a.card-link {{
      position: relative;
      text-decoration: none;
      border-bottom: 1px dotted var(--accent);
    }}
    a.card-link:hover,
    a.card-link:focus {{
      border-bottom-style: solid;
      outline: none;
    }}
    .card-tip {{
      display: none;
      position: fixed;
      z-index: 1000;
      width: 260px;
      padding: 0;
      border-radius: 10px;
      box-shadow: 0 12px 36px rgba(0,0,0,.45);
      font: 13px/1.35 system-ui, -apple-system, sans-serif;
      color: #f2f5f8;
      background: #1c2430;
      border: 1px solid #3a4a5c;
      pointer-events: none;
      text-align: left;
      white-space: normal;
      overflow: hidden;
    }}
    .card-tip.is-open {{ display: block; }}
    .card-tip .tip-top {{
      display: grid;
      grid-template-columns: 40px 1fr auto;
      gap: .45rem;
      align-items: start;
      padding: .65rem .7rem .4rem;
      background: linear-gradient(180deg, #2a3648, #1c2430);
    }}
    .card-tip .tip-cost {{
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffe08a, #c48a1a 55%, #6a4a10);
      color: #1a1408;
      font: 700 15px/36px system-ui, sans-serif;
      text-align: center;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.4);
    }}
    .card-tip .tip-title {{
      font: 700 14px/1.25 system-ui, sans-serif;
      color: #fff;
      padding-top: .15rem;
    }}
    .card-tip .tip-vp {{
      font: 700 12px/1.2 system-ui, sans-serif;
      color: #1a2430;
      background: #e8c15a;
      border-radius: 999px;
      padding: .2rem .45rem;
      align-self: start;
    }}
    .card-tip .tip-tags {{
      display: flex;
      flex-wrap: wrap;
      gap: .25rem;
      padding: .15rem .7rem .45rem;
      min-height: 2rem;
    }}
    .card-tip .tip-tag {{
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0e141c;
    }}
    .card-tip .tip-no-tags {{
      color: #8a97a6;
      font-size: 12px;
      padding: .25rem 0;
    }}
    .card-tip .tip-body {{
      display: block;
      padding: .55rem .75rem .7rem;
      background: #f4f7fa;
      color: #1a2430;
      font: 13px/1.4 Georgia, "Times New Roman", serif;
      min-height: 4.5rem;
    }}
    .card-tip .tip-foot {{
      display: flex;
      justify-content: space-between;
      gap: .5rem;
      align-items: center;
      padding: .4rem .7rem;
      font: 11px/1.2 system-ui, sans-serif;
      text-transform: uppercase;
      letter-spacing: .04em;
      background: #121820;
      color: #9aabbc;
    }}
    .card-tip .tip-type {{ color: #d7e2ec; font-weight: 700; }}
    .card-tip .tip-mod {{
      color: #0e1620;
      background: #7eb6c9;
      border-radius: 4px;
      padding: .15rem .35rem;
      font-weight: 700;
    }}
    .card-tip .tip-hint {{
      display: block;
      padding: .35rem .7rem .45rem;
      font: 11px/1.2 system-ui, sans-serif;
      color: #8a97a6;
      background: #0e141c;
    }}
    .card-tip.tip-corp .tip-top {{ background: linear-gradient(180deg, #5a3a28, #2a1c14); }}
    .card-tip.tip-active .tip-top {{ background: linear-gradient(180deg, #2f5a3a, #1a2e22); }}
    .card-tip.tip-event .tip-top {{ background: linear-gradient(180deg, #6a4a18, #2e2410); }}
    .card-tip.tip-sp .tip-top {{ background: linear-gradient(180deg, #3a4555, #1c2430); }}
    .card-tip.tip-prelude .tip-top {{ background: linear-gradient(180deg, #6a3a5a, #2a1824); }}
    @media (max-width: 640px) {{
      .card-tip {{ width: min(260px, calc(100vw - 16px)); }}
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div class="brand-row">
        <img class="exp" src="/assets/expansion_icons/expansion_icon_consortium.png"
             alt="Consortium expansion icon" width="56" height="56" />
        <div>
          <h1>Consortium</h1>
          <p>Player rulebook — fan expansion for Terraforming Mars. Cooperative megastructures, iridium, and a growing board.</p>
        </div>
      </div>
    </header>

    <p class="meta">
      For players. Design notes live under <code>docs/consortium/</code>.
      Board, tags, resources and megastructure emblems are generated by
      <code>tools/consortium-art/build_assets.py</code>.
      This page is regenerated by <code>python3 tools/consortium/build_rulebook.py</code>.
    </p>

    <nav class="toc" aria-label="Contents">
      <strong>Contents</strong>
      <a href="#setup">Setup</a>
      <a href="#board">Board</a>
      <a href="#iridium">Iridium</a>
      <a href="#tags">Tags</a>
      <a href="#megastructures">Megastructures</a>
      <a href="#scoring">Scoring</a>
      <a href="#faq">FAQ</a>
      <a href="#catalog">Card index</a>
    </nav>

    <h2 id="setup">1. Setup</h2>
    <ul>
      <li>Enable the <strong>Consortium</strong> expansion in the lobby.</li>
      <li>Pick a <strong>Consortium map</strong>: Massif (balanced), Rift Basin (iridium behind bridges), or Archipelago (more highlands). All use chasms, crater fields, highlands, and a locked frontier.</li>
      <li>Recommended: <strong>3–4 players</strong>.</li>
      <li>Shuffle Consortium project cards into the deck. Include corporations if corporations are on.</li>
      <li>Place the <strong>iridium bank</strong> (28 tokens). Players start with <strong>0 iridium</strong>.</li>
      <li>Set out the megastructure tracks: <strong>3 Bridges</strong> (one per sector) plus <strong>2 grand structures</strong> drawn from the pool of five.</li>
    </ul>
    <div class="callout">
      Without Consortium, the game is unchanged. With Consortium, use this map and these rules together.
    </div>

    <h2 id="board">2. The Consortium board</h2>
    <p>
      All three maps share the same hex geometry. Terrain overlays differ —
      pick the map in the lobby when you enable Consortium.
      Previews are generated by <code>tools/consortium-art/build_board.py</code>.
    </p>
    <div class="map-gallery">
      <figure class="map-card">
        <img src="/assets/consortium/maps/massif.png" alt="Massif map preview" width="891" height="860" />
        <figcaption class="map-body">
          <strong>Massif</strong>
          Balanced default. Even crater spread, mid-width chasms, playable early core.
          <p class="map-stats">6 highlands · 12 craters · 24 chasms · 27 locked</p>
        </figcaption>
      </figure>
      <figure class="map-card">
        <img src="/assets/consortium/maps/rift.png" alt="Rift Basin map preview" width="891" height="860" />
        <figcaption class="map-body">
          <strong>Rift Basin</strong>
          Iridium hunger. Wide chasm belts, scarce core craters, rich locked frontier.
          <p class="map-stats">6 highlands (clustered) · 13 craters · 30 chasms · 33 locked</p>
        </figcaption>
      </figure>
      <figure class="map-card">
        <img src="/assets/consortium/maps/archipelago.png" alt="Archipelago map preview" width="891" height="860" />
        <figcaption class="map-body">
          <strong>Archipelago</strong>
          Structure play. More highland islands, narrower chasms, wider open frontier.
          <p class="map-stats">9 highlands · 12 craters · 18 chasms · 21 locked</p>
        </figcaption>
      </figure>
    </div>

    <h3>Terrain</h3>
    <table>
      <thead>
        <tr><th>Terrain</th><th>Look</th><th>Rules</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="terrain t-chasm"></span> Chasm</td>
          <td>Dark / restricted</td>
          <td>Nothing may be placed until its sector’s Bridge converts those spaces (see megastructures). Uses the restricted-space mechanism.</td>
        </tr>
        <tr>
          <td><span class="terrain t-crater"></span> Crater field</td>
          <td>Orange / crater</td>
          <td>When you claim the space (city, greenery, special tile, etc.), gain <strong>1 iridium</strong> from the bank <em>once</em>.</td>
        </tr>
        <tr>
          <td><span class="terrain t-highland"></span> Highland</td>
          <td>Green / elevated</td>
          <td>No ocean. Some grand megastructures require you to own a highland tile before your first contribution.</td>
        </tr>
        <tr>
          <td><span class="terrain t-frontier"></span> Frontier</td>
          <td>Locked sectors</td>
          <td>Spaces start locked. Completing the matching <strong>Bridge</strong> unlocks that sector for normal play.</td>
        </tr>
      </tbody>
    </table>
    <p>Oceans, cities, greenery, and adjacency work as in the base game unless a card says otherwise.</p>

    <h2 id="iridium">3. Iridium</h2>
    <div class="icon-row">
      <div class="icon-card">
        <img src="/assets/resources/iridium.png" alt="Iridium resource icon" width="64" height="64" />
        <strong>Iridium</strong><br />Player resource · 4 M€
      </div>
    </div>
    <ul>
      <li><strong>Bank:</strong> 28 tokens. When empty, you cannot gain more until some returns.</li>
      <li><strong>Value:</strong> 1 iridium = <strong>4 M€</strong> when paying for eligible cards and megastructure segments.</li>
      <li><strong>Who may spend it:</strong> only cards/effects with a <strong>Structure</strong> tag, a <strong>Prospecting</strong> tag, or megastructure segment costs.</li>
      <li><strong>No general production.</strong> The only production source is <em>Siderophile Extraction</em> (deliberately <strong>no building tag</strong> — Robotic Workforce does not copy it).</li>
    </ul>
    <div class="callout warn">
      Iridium is not steel or titanium. It does not pay for arbitrary space or building cards.
    </div>
    <h3>Typical ways to get iridium</h3>
    <ul>
      <li>Claiming a crater-field space</li>
      <li>Card effects (Prospecting tags, events, corporation abilities)</li>
      <li>Contributor rewards on megastructures (especially Mohole)</li>
    </ul>

    <h2 id="tags">4. New tags</h2>
    <div class="icon-row">
      <div class="icon-card">
        <img src="/assets/tags/structure.png" alt="Structure tag" width="64" height="64" />
        <strong>Structure</strong><br />Megastructures, heavy builds
      </div>
      <div class="icon-card">
        <img src="/assets/tags/prospecting.png" alt="Prospecting tag" width="64" height="64" />
        <strong>Prospecting</strong><br />Survey &amp; iridium economy
      </div>
    </div>
    <p>They count for tag requirements, awards, and card text like any other tag. Many Structure/Prospecting cards accept iridium in payment.</p>

    <h2 id="megastructures">5. Megastructures</h2>
    <p>
      Each game has <strong>five tracks</strong>: three Bridges (sectors 0–2) and
      two grand structures drawn from the five below. Anyone may contribute
      <strong>one segment per standard action</strong> if they can pay.
      Global completion bonuses are modest; <strong>contributor</strong> rewards are the real prize.
    </p>
    <div class="mega-grid">
{megas}
    </div>
    <table>
      <thead>
        <tr><th>Track</th><th>Segments</th><th>On completion (global)</th><th>Contributors</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Bridge</strong> (×3)</td>
          <td>4 (keystone last)</td>
          <td>Unlocks that frontier sector</td>
          <td>+1 M€ production per segment owned</td>
        </tr>
        <tr>
          <td><strong>Space Elevator</strong></td>
          <td>6</td>
          <td>All: −2 M€ on space-tag cards</td>
          <td>Titanium production from segments</td>
        </tr>
        <tr>
          <td><strong>L1 Magnetic Shield</strong></td>
          <td>6</td>
          <td>All: −1 plant for greenery</td>
          <td>Plant production from segments</td>
        </tr>
        <tr>
          <td><strong>Mohole</strong></td>
          <td>6</td>
          <td>All: +1 heat production</td>
          <td>Iridium now + each generation</td>
        </tr>
        <tr>
          <td><strong>Solar Mirror</strong></td>
          <td>6</td>
          <td>Temperature +1 step</td>
          <td>Heat production from segments</td>
        </tr>
        <tr>
          <td><strong>Arcology</strong></td>
          <td>6</td>
          <td>All: +1 M€ production</td>
          <td>Extra VP per segment at end</td>
        </tr>
      </tbody>
    </table>
    <div class="callout ok">
      The <strong>keystone</strong> (final segment) always requires a minimum iridium spend
      (Bridge: 2; grand: 3). You cannot finish a track without iridium.
    </div>
    <ul>
      <li>Pay the segment cost (M€ / steel / titanium / iridium as allowed) → place your marker → take that segment’s contributor reward when the structure completes.</li>
      <li>On completion: contributors score <strong>1 VP per segment</strong> they paid for; the keystone player scores <strong>+2 VP</strong>.</li>
      <li><strong>Incomplete structures score 0 VP</strong> at game end (sunk cost).</li>
      <li>Space Elevator, Mohole and Solar Mirror require a highland tile you own before your <em>first</em> contribution on that track.</li>
    </ul>
    <p>Exact next-segment costs appear in the in-game megastructure panel.</p>

    <h2 id="scoring">6. Endgame scoring</h2>
    <p>Standard Terraforming Mars scoring, plus Consortium cards, milestones/awards, and VP from <em>completed</em> megastructure segments (and Arcology’s extra VP). Unfinished tracks give nothing.</p>

    <h2 id="faq">7. FAQ</h2>
    <h3>Can I pay iridium for a normal building or space card?</h3>
    <p>No — unless it has Structure or Prospecting (or is a megastructure segment).</p>
    <h3>Does Robotic Workforce copy Siderophile Extraction?</h3>
    <p>No. That card has no building tag on purpose.</p>
    <h3>What if the iridium bank is empty?</h3>
    <p>You cannot gain iridium until tokens return (spending puts them back).</p>
    <h3>Is the frontier optional?</h3>
    <p>Each sector stays locked until its Bridge is finished, then those spaces are in play.</p>
    <h3>Where do I browse card art in the app?</h3>
    <p><a href="/cards#consortium">Card gallery — filter “consortium”</a></p>

    <h2 id="catalog">8. Card index</h2>
    <p class="catalog-note">
      All <strong>{n}</strong> Consortium cards in the current build
      (from <code>src/genfiles/cards.json</code>).
      Hover a name for a card preview; click to open it in the
      <a href="/cards#consortium">card gallery</a>.
      After adding or changing cards, rerun <code>make:cards</code> then this script.
    </p>
    <div class="catalog-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Card</th>
            <th>Type</th>
            <th>Cost</th>
            <th>Tags</th>
            <th>Text</th>
          </tr>
        </thead>
        <tbody>
{catalog}
        </tbody>
      </table>
    </div>

    <footer>
      <p>
        Consortium is a fan expansion. Not affiliated with FryxGames.
        Artwork generated for this fork — do not hand-edit PNGs; change
        <code>tools/consortium-art/build_assets.py</code> instead.
        Rulebook regenerated by <code>tools/consortium/build_rulebook.py</code>.
      </p>
    </footer>
  </div>
  <script>
  (function () {{
    var openTip = null;
    var openLink = null;

    function hideTip() {{
      if (openTip) {{
        openTip.classList.remove('is-open');
        openTip.style.left = '';
        openTip.style.top = '';
        openTip = null;
        openLink = null;
      }}
    }}

    function placeTip(link, tip) {{
      tip.classList.add('is-open');
      var r = link.getBoundingClientRect();
      var tw = tip.offsetWidth || 260;
      var th = tip.offsetHeight || 280;
      var left = r.right + 10;
      var top = r.top;
      if (left + tw > window.innerWidth - 8) {{
        left = r.left - tw - 10;
      }}
      if (left < 8) left = 8;
      if (top + th > window.innerHeight - 8) {{
        top = window.innerHeight - th - 8;
      }}
      if (top < 8) top = 8;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }}

    function showTip(link) {{
      var tip = link.querySelector('.card-tip');
      if (!tip) return;
      if (openTip && openTip !== tip) hideTip();
      openTip = tip;
      openLink = link;
      placeTip(link, tip);
    }}

    document.querySelectorAll('a.card-link').forEach(function (link) {{
      link.addEventListener('mouseenter', function () {{ showTip(link); }});
      link.addEventListener('focus', function () {{ showTip(link); }});
      link.addEventListener('mouseleave', hideTip);
      link.addEventListener('blur', hideTip);
    }});

    window.addEventListener('scroll', function () {{
      if (openLink && openTip) placeTip(openLink, openTip);
    }}, true);
    window.addEventListener('resize', hideTip);
  }})();
  </script>
</body>
</html>
"""


def main() -> None:
    cards = load_consortium_cards()
    if not cards:
        raise SystemExit("No consortium cards found in cards.json — run make:cards first?")
    # Verify art paths exist so broken rulebooks fail at generate time.
    required = [
        ROOT / "assets/board/mars_consortium.png",
        ROOT / "assets/expansion_icons/expansion_icon_consortium.png",
        ROOT / "assets/resources/iridium.png",
        ROOT / "assets/tags/structure.png",
        ROOT / "assets/tags/prospecting.png",
        ROOT / "assets/consortium/maps/massif.png",
        ROOT / "assets/consortium/maps/rift.png",
        ROOT / "assets/consortium/maps/archipelago.png",
    ]
    for filename, _title, _blurb in MEGASTRUCTURES:
        required.append(ROOT / "assets/consortium/megastructures" / filename)
    missing = [str(p.relative_to(ROOT)) for p in required if not p.is_file()]
    if missing:
        raise SystemExit("Missing art assets:\n  " + "\n  ".join(missing))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(build_html(cards), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(cards)} cards)")


if __name__ == "__main__":
    main()
