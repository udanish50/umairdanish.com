#!/usr/bin/env python3
"""Refresh the public Google Scholar snapshot through SerpApi.

The script intentionally keeps the last valid snapshot if the remote request
fails or returns an incomplete response. It uses only Python's standard library.
"""
from __future__ import annotations
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

AUTHOR_ID = "vDmY-KUAAAAJ"
OUTPUT = Path("assets/data/scholar-metrics.json")
ENDPOINT = "https://serpapi.com/search.json"

def metric(table, key):
    for row in table or []:
        value = row.get(key)
        if isinstance(value, dict):
            return {
                "all": int(value.get("all", 0) or 0),
                "since_year": int(next((v for k, v in value.items() if k != "all"), 0) or 0),
                "since_label": next((k.replace("_", " ").title() for k in value if k != "all"), "Recent"),
            }
    raise ValueError(f"Missing Google Scholar metric: {key}")

def main() -> int:
    key = os.environ.get("SERPAPI_KEY", "").strip()
    if not key:
        print("SERPAPI_KEY is not configured; retaining the existing Scholar snapshot.")
        return 0
    params = urllib.parse.urlencode({
        "engine": "google_scholar_author",
        "author_id": AUTHOR_ID,
        "hl": "en",
        "num": 100,
        "sort": "pubdate",
        "api_key": key,
    })
    request = urllib.request.Request(f"{ENDPOINT}?{params}", headers={"User-Agent": "umairdanish.com-scholar-refresh/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = json.load(response)
        if raw.get("error"):
            raise RuntimeError(raw["error"])
        if raw.get("search_metadata", {}).get("status") not in {None, "Success"}:
            raise RuntimeError("SerpApi search did not complete successfully")
        cited = raw.get("cited_by") or {}
        table = cited.get("table") or []
        citations = metric(table, "citations")
        h_index = metric(table, "h_index")
        i10_index = metric(table, "i10_index")
        articles = []
        for article in raw.get("articles") or []:
            articles.append({
                "title": article.get("title", "").strip(),
                "citations": int((article.get("cited_by") or {}).get("value", 0) or 0),
                "year": str(article.get("year") or ""),
                "publication": article.get("publication", ""),
                "authors": article.get("authors", ""),
                "citation_id": article.get("citation_id", ""),
                "link": article.get("link", ""),
            })
        if not articles or citations["all"] < 1:
            raise RuntimeError("Scholar response failed validation; refusing to replace the last valid snapshot")
    graph_source = (
    cited.get("graph")
    or raw.get("citation_graph")
    or raw.get("cites_per_year")
    or []
)

graph = [
    {
        "year": int(item["year"]),
        "citations": int(item.get("citations", item.get("value", 0)) or 0),
    }
    for item in graph_source
    if item.get("year")
]

if not graph and OUTPUT.exists():
    try:
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
        graph = previous.get("citation_graph") or []
    except (OSError, ValueError, TypeError):
        graph = []
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        payload = {
            "source": "Google Scholar via SerpApi",
            "status": "live",
            "author_id": AUTHOR_ID,
            "profile_url": f"https://scholar.google.com/citations?hl=en&user={AUTHOR_ID}",
            "updated_at": now,
            "metrics": {
                "citations": citations,
                "h_index": h_index,
                "i10_index": i10_index,
                "article_count": len(articles),
            },
            "citation_graph": graph,
            "articles": articles,
            "public_access": raw.get("public_access") or {},
            "author": raw.get("author") or {},
        }
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        temp = OUTPUT.with_suffix(".tmp")
        temp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        temp.replace(OUTPUT)
        print(f"Updated Google Scholar snapshot: {citations['all']} citations, h-index {h_index['all']}, i10-index {i10_index['all']}, {len(articles)} works.")
        return 0
    except Exception as exc:
        print(f"Google Scholar refresh failed; retaining the last valid snapshot: {exc}", file=sys.stderr)
        return 0 if OUTPUT.exists() else 1

if __name__ == "__main__":
    raise SystemExit(main())
