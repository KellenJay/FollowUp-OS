"""Shared helpers for foundry_upload.py (golden/synthetic results) and
foundry_upload_live.py (real production results) -- both push pre-computed
Claude-judge scores into Azure AI Foundry's classic Evaluation view as a
passthrough, never re-grading anything themselves."""

import json
from pathlib import Path

from dotenv import load_dotenv
from azure.ai.evaluation import evaluate

SCRIPT_DIR = Path(__file__).parent
load_dotenv(SCRIPT_DIR.parent.parent / ".env.local")


class PassthroughEvaluator:
    """Echoes a score already computed by grade.ts (Claude judge) instead of
    grading anything itself -- Foundry just needs a callable that returns a
    numeric score per row for it to log as an evaluator column."""

    def __init__(self, dimension_id: str):
        self.dimension_id = dimension_id

    def __call__(self, *, score: float, **kwargs) -> dict:
        return {self.dimension_id: score}


def normalize(score_0_to_100: float) -> float:
    """Foundry's custom-evaluator convention expects 0.0-1.0; our existing
    rubric scores are 0-100."""
    return round(score_0_to_100 / 100.0, 4)


def upload_decision_point(decision_point: dict, project_endpoint: str, rows: list[dict], evaluation_name: str):
    dp_id = decision_point["id"]
    dimension_ids = [d["id"] for d in decision_point["dimensions"]]

    dataset_dir = SCRIPT_DIR / "results" / "foundry_datasets"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = dataset_dir / f"{evaluation_name}.jsonl"
    with open(dataset_path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")

    evaluators = {"total_score": PassthroughEvaluator("total_score")}
    evaluator_config = {"total_score": {"column_mapping": {"score": "${data.total_score}"}}}
    for dim_id in dimension_ids:
        evaluators[dim_id] = PassthroughEvaluator(dim_id)
        evaluator_config[dim_id] = {"column_mapping": {"score": f"${{data.{dim_id}_score}}"}}

    print(f"\n=== Uploading {evaluation_name} ({len(rows)} rows) ===")
    result = evaluate(
        data=str(dataset_path),
        evaluators=evaluators,
        evaluator_config=evaluator_config,
        azure_ai_project=project_endpoint,
        evaluation_name=evaluation_name,
    )
    print(f"Uploaded {evaluation_name} -> {result.get('studio_url', '(no studio URL returned)')}")
