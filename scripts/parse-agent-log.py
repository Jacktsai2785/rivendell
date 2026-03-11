#!/usr/bin/env python3
"""Parse Claude stream-json output into structured JSONL logs.

Reads stream-json from stdin, writes:
  - Structured JSONL events to --output file
  - Plain text (assistant text blocks) to stdout for backward compat

Event types emitted:
  thinking  — extended thinking block (preview + length)
  tool      — tool_use call (name + input)
  text      — assistant text block
  result    — token usage summary with cost estimate
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


# Cost per token (USD) — Claude Opus 4 pricing
COST_INPUT = 15.0 / 1_000_000
COST_OUTPUT = 75.0 / 1_000_000


def ts() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def write_event(outf, event: dict):
    event["ts"] = ts()
    outf.write(json.dumps(event, ensure_ascii=False) + "\n")
    outf.flush()


def parse_stream(inf, outf):
    """Parse stream-json lines from inf, write structured events to outf."""
    # Accumulators for current content block
    current_block_type = None  # "thinking" | "text" | "tool_use"
    current_tool_name = None
    accumulated_text = ""
    accumulated_json = ""

    while True:
        raw_line = inf.readline()
        if not raw_line:
            break
        line = raw_line.strip()
        if not line:
            continue

        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        etype = event.get("type", "")

        # --- Stream events ---
        if etype == "stream_event":
            se = event.get("event", {})
            se_type = se.get("type", "")

            if se_type == "content_block_start":
                cb = se.get("content_block", {})
                current_block_type = cb.get("type", "")
                accumulated_text = ""
                accumulated_json = ""

                if current_block_type == "tool_use":
                    current_tool_name = cb.get("name", "")
                elif current_block_type == "thinking":
                    pass
                elif current_block_type == "text":
                    pass

            elif se_type == "content_block_delta":
                delta = se.get("delta", {})
                dtype = delta.get("type", "")

                if dtype == "thinking_delta":
                    accumulated_text += delta.get("thinking", "")
                elif dtype == "text_delta":
                    accumulated_text += delta.get("text", "")
                elif dtype == "input_json_delta":
                    accumulated_json += delta.get("partial_json", "")

            elif se_type == "content_block_stop":
                if current_block_type == "thinking":
                    preview = accumulated_text[:120].replace("\n", " ")
                    write_event(outf, {
                        "type": "thinking",
                        "len": len(accumulated_text),
                        "preview": preview,
                    })
                elif current_block_type == "text":
                    write_event(outf, {
                        "type": "text",
                        "len": len(accumulated_text),
                        "text": accumulated_text,
                    })
                    # Write text to stdout for backward compat
                    sys.stdout.write(accumulated_text)
                    sys.stdout.flush()
                elif current_block_type == "tool_use":
                    write_event(outf, {
                        "type": "tool",
                        "name": current_tool_name or "unknown",
                        "input": accumulated_json,
                    })

                current_block_type = None
                current_tool_name = None
                accumulated_text = ""
                accumulated_json = ""

        # --- Full assistant message (fallback) ---
        elif etype == "assistant":
            message = event.get("message", {})
            for item in message.get("content", []):
                itype = item.get("type", "")
                if itype == "text":
                    text = item.get("text", "")
                    # stdout output (may duplicate if stream events also present)
                    sys.stdout.write(text)
                    sys.stdout.flush()

        # --- Result with token usage ---
        elif etype == "result":
            usage = event.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
            cost = input_tokens * COST_INPUT + output_tokens * COST_OUTPUT
            model = event.get("model", "unknown")
            write_event(outf, {
                "type": "result",
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_usd": round(cost, 4),
            })


def main():
    parser = argparse.ArgumentParser(description="Parse Claude stream-json into structured JSONL")
    parser.add_argument("--output", "-o", required=True, help="Path to structured JSONL output file")
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "a", encoding="utf-8") as outf:
        parse_stream(sys.stdin, outf)


if __name__ == "__main__":
    main()
