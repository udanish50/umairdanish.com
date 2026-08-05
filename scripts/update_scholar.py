#!/usr/bin/env python3
"""Refresh the public Google Scholar snapshot through SerpApi.

The script keeps the last valid snapshot if the remote request fails or
returns incomplete data. It uses only Python's standard library.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


AUTHOR_ID = "vDmY-KUAAAAJ"
OUTPUT = Path("assets/data/scholar-metrics.json")
ENDPOINT = "https://serpapi.com/search.json"


def safe_int(value: Any, default: int = 0) -> int:
    """Convert a value to int without crashing on missing or invalid data."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def load_previous_snapshot() -> dict[str, Any]:
    """Load the last valid local snapshot, when available."""
    if not OUTPUT.exists():
        return {}

    try:
        data = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError, TypeError):
        return {}


def metric(table: list[dict[str, Any]], key: str) -> dict[str, Any]:
    """Extract one metric from the Google Scholar cited-by table."""
    for row in table or []:
        value = row.get(key)

        if not isinstance(value, dict):
            continue

        recent_key = next((item for item in value if item != "all"), None)

        return {
            "all": safe_int(value.get("all")),
            "since_year": safe_int(value.get(recent_key)) if recent_key else 0,
            "since_label": (
                recent_key.replace("_", " ").title()
                if recent_key
                else "Recent"
            ),
        }

    raise ValueError(f"Missing Google Scholar metric: {key}")


def normalize_graph(graph_source: Any) -> list[dict[str, int]]:
    """Normalize possible SerpApi citation-history formats."""
    graph: list[dict[str, int]] = []

    if isinstance(graph_source, dict):
        for year, citations in graph_source.items():
            if str(year).isdigit():
                graph.append(
                    {
                        "year": safe_int(year),
                        "citations": safe_int(citations),
                    }
                )

    elif isinstance(graph_source, list):
        for item in graph_source:
            if not isinstance(item, dict):
                continue

            year = item.get("year")
            if year in (None, ""):
                continue

            citations = item.get(
                "citations",
                item.get(
                    "value",
                    item.get("count", 0),
                ),
            )

            graph.append(
                {
                    "year": safe_int(year),
                    "citations": safe_int(citations),
                }
            )

    graph = [
        item
        for item in graph
        if item["year"] > 0
    ]

    graph.sort(key=lambda item: item["year"])
    return graph


def normalize_articles(raw_articles: Any) -> list[dict[str, Any]]:
    """Normalize Scholar publication records and article citation counts."""
    articles: list[dict[str, Any]] = []

    if not isinstance(raw_articles, list):
        return articles

    for article in raw_articles:
        if not isinstance(article, dict):
            continue

        title = str(article.get("title") or "").strip()
        if not title:
            continue

        cited_by = article.get("cited_by")
        if not isinstance(cited_by, dict):
            cited_by = {}

        citation_count = safe_int(
            cited_by.get(
                "value",
                cited_by.get(
                    "total",
                    cited_by.get("citations", 0),
                ),
            )
        )

        articles.append(
            {
                "title": title,
                "citations": citation_count,
                "year": str(article.get("year") or ""),
                "publication": str(article.get("publication") or ""),
                "authors": str(article.get("authors") or ""),
                "citation_id": str(article.get("citation_id") or ""),
                "link": str(article.get("link") or ""),
            }
        )

    return articles


def fetch_scholar_data(api_key: str) -> dict[str, Any]:
    """Request the public Google Scholar author record through SerpApi."""
    params = urllib.parse.urlencode(
        {
            "engine": "google_scholar_author",
            "author_id": AUTHOR_ID,
            "hl": "en",
            "num": 100,
            "sort": "pubdate",
            "api_key": api_key,
        }
    )

    request = urllib.request.Request(
        f"{ENDPOINT}?{params}",
        headers={
            "User-Agent": "umairdanish.com-scholar-refresh/2.0",
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        raw = json.load(response)

    if not isinstance(raw, dict):
        raise RuntimeError("SerpApi returned an invalid response")

    if raw.get("error"):
        raise RuntimeError(str(raw["error"]))

    metadata = raw.get("search_metadata")
    if isinstance(metadata, dict):
        status = metadata.get("status")
        if status not in {None, "Success", "Cached"}:
            raise RuntimeError(
                f"SerpApi search status was not successful: {status}"
            )

    return raw


def main() -> int:
    previous = load_previous_snapshot()
    api_key = os.environ.get("SERPAPI_KEY", "").strip()

    if not api_key:
        print(
            "SERPAPI_KEY is not configured; retaining the existing "
            "Google Scholar snapshot.",
            file=sys.stderr,
        )
        return 0 if OUTPUT.exists() else 1

    try:
        raw = fetch_scholar_data(api_key)

        cited_by = raw.get("cited_by")
        if not isinstance(cited_by, dict):
            cited_by = {}

        table = cited_by.get("table")
        if not isinstance(table, list):
            table = []

        citations = metric(table, "citations")
        h_index = metric(table, "h_index")
        i10_index = metric(table, "i10_index")

        if citations["all"] < 1:
            raise RuntimeError(
                "Scholar response failed validation: total citations "
                "were missing or zero"
            )

        articles = normalize_articles(raw.get("articles"))

        if not articles:
            previous_articles = previous.get("articles")
            if isinstance(previous_articles, list):
                articles = previous_articles

        graph_source = (
            cited_by.get("graph")
            or raw.get("citation_graph")
            or raw.get("cites_per_year")
            or raw.get("citations_per_year")
            or []
        )

        graph = normalize_graph(graph_source)

        if not graph:
            previous_graph = previous.get("citation_graph")
            graph = normalize_graph(previous_graph)

        if not articles:
            raise RuntimeError(
                "Scholar response did not contain articles and no previous "
                "article snapshot was available"
            )

        now = (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )

        payload = {
            "source": "Google Scholar via SerpApi",
            "status": "live",
            "author_id": AUTHOR_ID,
            "profile_url": (
                "https://scholar.google.com/citations"
                f"?hl=en&user={AUTHOR_ID}"
            ),
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
            "author": raw.get("author") or previous.get("author") or {},
        }

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)

        temp = OUTPUT.with_suffix(".tmp")
        temp.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        temp.replace(OUTPUT)

        print(
            "Updated Google Scholar snapshot: "
            f"{citations['all']} citations, "
            f"h-index {h_index['all']}, "
            f"i10-index {i10_index['all']}, "
            f"{len(articles)} works, "
            f"{len(graph)} citation-history points."
        )

        if not graph:
            print(
                "Warning: SerpApi returned no annual citation graph; "
                "the previous graph was unavailable.",
                file=sys.stderr,
            )

        return 0

    except Exception as exc:
        print(
            "Google Scholar refresh failed; retaining the last valid "
            f"snapshot: {exc}",
            file=sys.stderr,
        )
        return 0 if OUTPUT.exists() else 1


if __name__ == "__main__":
    raise SystemExit(main())
