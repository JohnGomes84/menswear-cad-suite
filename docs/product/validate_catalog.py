#!/usr/bin/env python3
"""Validate the discovery catalogue without implying methods are implemented."""
import json
import re
from collections import Counter
from pathlib import Path

REGISTRY = Path(__file__).resolve().parent / "PATTERN-CATALOG-001.json"
ALLOWED_STATUS = {"TOC_ONLY", "TEXT_REVIEWED", "DIAGRAM_REVIEWED"}
ALLOWED_IMPLEMENTATION = {"NOT_STARTED", "IN_PROGRESS", "IMPLEMENTED"}
ALLOWED_VALIDATION = {"NOT_RUN", "PASS", "FAIL", "WARNING"}


def validate(path=REGISTRY):
    doc = json.loads(Path(path).read_text(encoding="utf-8"))
    assert doc["schema"] == "book-method-catalog/0.1.0"
    assert doc["source"]["edition"] == 5
    methods = doc["methods"]
    assert methods and isinstance(methods, list)
    chapters = {row["chapter"] for row in methods}
    assert chapters == set(range(1, 15)), f"Missing chapter(s): {set(range(1,15)) - chapters}"
    ids = [row["methodId"] for row in methods]
    assert len(ids) == len(set(ids)), "Duplicate methodId"
    for row in methods:
        assert re.fullmatch(r"ALD-CH\d{2}-\d{2}", row["methodId"])
        assert int(row["methodId"][6:8]) == row["chapter"]
        assert row["sourceVerification"] in ALLOWED_STATUS
        assert row["implementation"] in ALLOWED_IMPLEMENTATION
        assert row["modelValidation"] in ALLOWED_VALIDATION
        assert row["physicalValidation"] in ALLOWED_VALIDATION
        assert row["sourceLocation"]["methodPdfPageRange"] is None or row["sourceLocation"]["methodPdfPageRange"][0] >= 1
        assert row["category"] in {"SUPPORT", "BLOCK", "PROCESS", "FAMILY", "TRANSFORMATION", "REFERENCE"}
        assert row["geometrySpecification"] in {"NOT_YET_DEFINED", "DRAFT", "IN_REVIEW", "APPROVED"}
        assert row["slug"] and row["family"] and row["topic"]
        if row["sourceVerification"] in {"TEXT_REVIEWED", "DIAGRAM_REVIEWED"}:
            pages = row["sourceLocation"]["methodPdfPageRange"]
            assert isinstance(pages, list) and len(pages) == 2
            assert all(isinstance(p, int) and p > 0 for p in pages)
            assert pages[0] <= pages[1]
            assert isinstance(row.get("reviewEvidence"), str) and row["reviewEvidence"].endswith(".md")
        if row.get("diagramReview") == "PARTIAL_FRONT_BACK_GUIDES":
            assert row["sourceVerification"] == "TEXT_REVIEWED"
            assert isinstance(row.get("diagramEvidence"), str) and row["diagramEvidence"].endswith(".md")
            assert row["geometrySpecification"] == "NOT_YET_DEFINED"
        if row["implementation"] == "IMPLEMENTED":
            assert row["geometrySpecification"] == "APPROVED"
            assert row["ruleSetId"]
        if row["modelValidation"] == "PASS":
            assert row["implementation"] == "IMPLEMENTED"
    counts = Counter(x["sourceVerification"] for x in methods)
    print(f"VALID: {len(methods)} candidate topics, 14 chapters; evidence {dict(counts)}")
    return doc


if __name__ == "__main__":
    validate()
