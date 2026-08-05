#!/usr/bin/env python3
"""Refresh Google Scholar metrics through SerpApi.

The script:
1. Retrieves the Scholar author profile.
2. Makes a second clean request if citation history is missing.
3. Never overwrites a valid snapshot with incomplete data.
4. Fails the workflow when no yearly citation graph can be retrieved.
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
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def load_previous() -> dict[str, Any]:
    if not OUTPUT.exists():
        return {}

    try:
        data = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def extract_metric(
    table: list[dict[str, Any]],
    metric_name: str,
) -> dict[str, Any]:
    for row in table:
        value = row.get(metric_name)

        if not isinstance(value, dict):
            continue

        recent_key = next(
            (key for key in value if key != "all"),
            None,
        )

        return {
            "all": safe_int(value.get("all")),
            "since_year": (
                safe_int(value.get(recent_key))
                if recent_key
                else 0
            ),
            "since_label": (
                recent_key.replace("_", " ").title()
                if recent_key
                else "Recent"
            ),
        }

    raise RuntimeError(
        f"Google Scholar metric is missing: {metric_name}"
    )


def normalize_graph(source: Any) -> list[dict[str, int]]:
    graph: list[dict[str, int]] = []

    if isinstance(source, list):
        for item in source:
            if not isinstance(item, dict):
                continue

            year = safe_int(item.get("year"))
            citations = safe_int(
                item.get(
                    "citations",
                    item.get(
                        "value",
                        item.get("count", 0),
                    ),
                )
            )

            if year > 0:
                graph.append(
                    {
                        "year": year,
                        "citations": citations,
                    }
                )

    elif isinstance(source, dict):
        for year, citations in source.items():
            parsed_year = safe_int(year)

            if parsed_year > 0:
                graph.append(
                    {
                        "year": parsed_year,
                        "citations": safe_int(citations),
                    }
                )

    graph.sort(key=lambda item: item["year"])
    return graph


def normalize_articles(source: Any) -> list[dict[str, Any]]:
    if not isinstance(source, list):
        return []

    articles: list[dict[str, Any]] = []

    for article in source:
        if not isinstance(article, dict):
            continue

        title = str(article.get("title") or "").strip()
        if not title:
            continue

        cited_by = article.get("cited_by")
        if not isinstance(cited_by, dict):
            cited_by = {}

        articles.append(
            {
                "title": title,
                "citations": safe_int(
                    cited_by.get(
                        "value",
                        cited_by.get(
                            "total",
                            cited_by.get("citations", 0),
                        ),
                    )
                ),
                "year": str(article.get("year") or ""),
                "publication": str(
                    article.get("publication") or ""
                ),
                "authors": str(article.get("authors") or ""),
                "citation_id": str(
                    article.get("citation_id") or ""
                ),
                "link": str(article.get("link") or ""),
            }
        )

    return articles


def request_serpapi(
    api_key: str,
    *,
    include_article_options: bool,
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "engine": "google_scholar_author",
        "author_id": AUTHOR_ID,
        "hl": "en",
        "api_key": api_key,
        "no_cache": "true",
    }

    if include_article_options:
        params.update(
            {
                "num": 100,
                "sort": "pubdate",
            }
        )

    url = f"{ENDPOINT}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "umairdanish.com-scholar-refresh/3.0"
            ),
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=90,
    ) as response:
        raw = json.load(response)

    if not isinstance(raw, dict):
        raise RuntimeError(
            "SerpApi returned an invalid JSON response"
        )

    if raw.get("error"):
        raise RuntimeError(str(raw["error"]))

    metadata = raw.get("search_metadata")
    if isinstance(metadata, dict):
        status = metadata.get("status")

        if status not in {None, "Success", "Cached"}:
            raise RuntimeError(
                f"SerpApi status was: {status}"
            )

    return raw


def graph_from_response(
    raw: dict[str, Any],
) -> list[dict[str, int]]:
    cited_by = raw.get("cited_by")

    if not isinstance(cited_by, dict):
        cited_by = {}

    possible_sources = [
        cited_by.get("graph"),
        raw.get("citation_graph"),
        raw.get("citations_per_year"),
        raw.get("cites_per_year"),
    ]

    for source in possible_sources:
        graph = normalize_graph(source)

        if graph:
            return graph

    return []


def main() -> int:
    api_key = os.environ.get("SERPAPI_KEY", "").strip()

    if not api_key:
        print(
            "SERPAPI_KEY is missing.",
            file=sys.stderr,
        )
        return 1

    previous = load_previous()

    try:
        primary = request_serpapi(
            api_key,
            include_article_options=True,
        )

        cited_by = primary.get("cited_by")
        if not isinstance(cited_by, dict):
            cited_by = {}

        table = cited_by.get("table")
        if not isinstance(table, list):
            table = []

        citations = extract_metric(
            table,
            "citations",
        )
        h_index = extract_metric(
            table,
            "h_index",
        )
        i10_index = extract_metric(
            table,
            "i10_index",
        )

        if citations["all"] < 1:
            raise RuntimeError(
                "Total citation count is missing or zero"
            )

        articles = normalize_articles(
            primary.get("articles")
        )

        if not articles:
            previous_articles = previous.get("articles")

            if isinstance(previous_articles, list):
                articles = previous_articles

        if not articles:
            raise RuntimeError(
                "No Scholar articles were returned"
            )

        graph = graph_from_response(primary)

        if not graph:
            print(
                "Primary response contained no citation graph; "
                "requesting a fresh author overview.",
                file=sys.stderr,
            )

            secondary = request_serpapi(
                api_key,
                include_article_options=False,
            )

            graph = graph_from_response(secondary)

        if not graph:
            raise RuntimeError(
                "SerpApi returned no cited_by.graph data "
                "in either Scholar request"
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
            "public_access": (
                primary.get("public_access") or {}
            ),
            "author": (
                primary.get("author")
                or previous.get("author")
                or {}
            ),
        }

        OUTPUT.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temporary = OUTPUT.with_suffix(".tmp")

        temporary.write_text(
            json.dumps(
                payload,
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        temporary.replace(OUTPUT)

        print(
            "Updated Google Scholar snapshot: "
            f"{citations['all']} citations, "
            f"h-index {h_index['all']}, "
            f"i10-index {i10_index['all']}, "
            f"{len(articles)} works, "
            f"{len(graph)} yearly data points."
        )

        return 0

    except Exception as exc:
        print(
            f"Google Scholar refresh failed: {exc}",
            file=sys.stderr,
        )

        print(
            "The existing snapshot was not changed.",
            file=sys.stderr,
        )

        return 1


if __name__ == "__main__":
    raise SystemExit(main())
