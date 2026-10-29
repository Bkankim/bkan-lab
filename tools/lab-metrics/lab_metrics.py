#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""lab.bkan.dev 실험별 생산 지표 집계.

에이전트 세션 기록을 읽어 실험 한 개를 만드는 데 든 딸깍·시간·모델·비용을 뽑는다.
읽는 기록: Claude Code(~/.claude/projects, 서브에이전트 포함), Codex(~/.codex/sessions).
어떤 세션의 어느 구간이 어느 실험인지는 items.json(매니페스트)에 사람이 정한다.
세션 하나가 여러 실험에 걸치기 때문에 자동 매칭은 후보 제시까지만 한다.

  find <키워드>...      키워드가 나오는 세션 후보 나열
  prompts <세션>        세션의 사람 입력 목록(구간·교정 표시를 고를 때 씀, 로컬 출력 전용)
  build [슬러그...]     items.json 기준으로 집계해 frontend/<슬러그>/metrics.json 기록
"""

import argparse
import difflib
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
CLAUDE = os.path.expanduser("~/.claude/projects")
CODEX = os.path.expanduser("~/.codex/sessions")
MANIFEST = os.path.join(HERE, "items.json")
PRICING = os.path.join(HERE, "pricing.json")

# 같은 지시를 고쳐 다시 보낸 것으로 보고 하나로 합치는 기준
RESEND_WINDOW_S = 60
RESEND_SIMILARITY = 0.8
# 기록 사이 공백이 이보다 길면 쉰 것으로 본다. 단 승인 없이 끝난 도구 실행과 모델 응답 생성은 길어도 일한 시간이다.
IDLE_GAP_S = 600
AGENT_TOOLS = ("Agent", "Task")
# Codex가 사용자 역할로 끼워 넣는 메시지. 사람이 친 글이 아니다(전체 롤아웃에서 실측한 접두어).
CODEX_INJECTED = ("# AGENTS.md instructions", "# Files pasted by the user", "# Files mentioned by the user",
                  "<recommended_plugins", "<codex_internal_context", "<environment_context", "<user_action",
                  "<skill", "<turn_aborted", "<send_user_message_question", "<external_codex_apps",
                  "<user_instructions", "<permissions")


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def iso(d):
    return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_jsonl(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


# ---------- 정규화된 이벤트 ----------

@dataclass
class Prompt:
    t: datetime
    id: str
    text: str
    merged: list = field(default_factory=list)  # 재전송으로 합쳐진 앞 메시지 id


@dataclass
class Request:
    t: datetime
    key: str
    model: str
    input: int = 0
    cache_write_5m: int = 0
    cache_write_1h: int = 0
    cache_read: int = 0
    output: int = 0
    web_search: int = 0
    fast: bool = False


@dataclass
class Session:
    runtime: str
    id: str
    prompts: list = field(default_factory=list)
    requests: list = field(default_factory=list)
    busy: list = field(default_factory=list)  # (시작, 끝) 본체·서브에이전트가 실제로 일한 구간
    agents: list = field(default_factory=list)  # (시작, 끝, 종류) 서브에이전트
    approvals: list = field(default_factory=list)  # (승인 시각, 기다린 초) 사람이 도구 실행을 승인한 것
    tools: list = field(default_factory=list)  # (시각, 명령 문자열 또는 "")
    searches: list = field(default_factory=list)  # 요청 usage 밖에서 기록된 웹 검색 시각(Codex)
    stamps: list = field(default_factory=list)


def text_of(content):
    if isinstance(content, str):
        return content
    return "\n".join(b.get("text", "") for b in content if b.get("type") == "text")


def claude_assistant(d, sess, t):
    msg = d.get("message") or {}
    model = msg.get("model")
    if not model or model == "<synthetic>":
        return
    for b in msg.get("content") or []:
        if b.get("type") == "tool_use":
            cmd = (b.get("input") or {}).get("command", "")
            sess.tools.append((t, cmd if isinstance(cmd, str) else ""))
    u = msg.get("usage") or {}
    cc = u.get("cache_creation") or {}
    sess.requests.append(Request(
        t=t,
        # 응답 하나가 블록마다 한 줄씩 기록되며 같은 usage가 반복된다. 요청 단위로 한 번만 센다.
        key=d.get("requestId") or msg.get("id") or d.get("uuid"),
        model=model,
        input=u.get("input_tokens", 0),
        cache_write_5m=cc.get("ephemeral_5m_input_tokens", 0) if cc else u.get("cache_creation_input_tokens", 0),
        cache_write_1h=cc.get("ephemeral_1h_input_tokens", 0),
        cache_read=u.get("cache_read_input_tokens", 0),
        output=u.get("output_tokens", 0),
        web_search=(u.get("server_tool_use") or {}).get("web_search_requests", 0) or 0,
        fast=u.get("speed") == "fast",
    ))


def claude_actor(rows, sess, main=False):
    """본체 또는 서브에이전트 한 명의 기록에서 실제로 일한 구간과 사람 승인 대기를 뽑는다.

    이웃한 기록 사이 공백은 짧으면 일한 시간이다. 길면 그 공백을 끝낸 기록으로 판단한다:
    모델 응답이거나 승인 없이 돌아온 도구 결과면 일한 시간, 사람이 승인한 도구 결과면 대기,
    서브에이전트 호출 결과면 그 에이전트 기록이 따로 세므로 제외, 나머지는 쉰 시간.
    본체는 턴 안의 공백만 본다. 턴은 사람 입력·작업 알림으로 시작해 turn_duration·
    stop_hook_summary·중단 표시로 끝난다(끝 표시가 없는 중단·진행 중 턴도 다음 시작까지는 턴으로 본다).
    """
    tool_kind = {}
    background = {}  # 백그라운드로 띄운 도구(aside exec 등): 띄운 시각부터 완료 알림까지 일한 시간
    events = []
    for d in rows:
        t = ts(d["timestamp"])
        kind = d.get("type")
        content = (d.get("message") or {}).get("content")
        if kind == "assistant":
            for b in content or []:
                if b.get("type") == "tool_use":
                    tool_kind[b.get("id")] = (b.get("name"), t)
                    if (b.get("input") or {}).get("run_in_background") and b.get("name") not in AGENT_TOOLS:
                        background[b.get("id")] = t
            events.append((t, "model"))
        elif kind == "user" and "<task-notification>" in text_of(content or ""):
            m = re.search(r"<tool-use-id>([^<]+)</tool-use-id>", text_of(content))
            if m and m.group(1) in background:
                sess.busy.append((background.pop(m.group(1)), t))
            events.append((t, "start" if main else "other"))
        elif kind == "user" and (d.get("origin") or {}).get("kind") == "human":
            events.append((t, "start" if main else "other"))
        elif kind == "system" and d.get("subtype") in ("turn_duration", "stop_hook_summary"):
            events.append((t, "end" if main else "other"))
        elif kind == "user" and isinstance(content, list):
            results = [b for b in d["message"]["content"] if b.get("type") == "tool_result"]
            if not results:
                interrupted = text_of(content).startswith("[Request interrupted")
                events.append((t, "end" if main and interrupted else "other"))
                continue
            name, called = tool_kind.get(results[0].get("tool_use_id"), (None, None))
            source = (d.get("permissionDecision") or {}).get("source", "")
            if source.startswith("user"):
                events.append((t, "approved"))
                if called:
                    sess.approvals.append((t, (t - called).total_seconds()))
            elif name in AGENT_TOOLS:
                events.append((t, "agent"))
            else:
                events.append((t, "tool"))
        else:
            events.append((t, "other"))
    events.sort(key=lambda e: e[0])
    in_turn = not main
    for (a, first), (b, kind) in zip(events, events[1:]):
        if main and first == "start":
            in_turn = True
        if in_turn and kind not in ("approved", "agent"):
            if (b - a).total_seconds() <= IDLE_GAP_S or kind in ("model", "tool"):
                sess.busy.append((a, b))
        if main and kind == "end":
            in_turn = False


def load_claude(sid):
    hits = glob.glob(os.path.join(CLAUDE, "*", f"{sid}.jsonl"))
    if not hits:
        sys.exit(f"Claude Code 세션 기록을 찾지 못함: {sid}")
    path = hits[0]
    sess = Session("claude-code", sid)
    rows = []
    for d in read_jsonl(path):
        if not d.get("timestamp"):
            continue
        t = ts(d["timestamp"])
        rows.append(d)
        sess.stamps.append(t)
        kind = d.get("type")
        if kind == "user" and (d.get("origin") or {}).get("kind") == "human":
            sess.prompts.append(Prompt(t, d.get("uuid", ""), text_of(d["message"]["content"])))
        elif kind == "assistant":
            claude_assistant(d, sess, t)
    claude_actor(rows, sess, main=True)

    for f in sorted(glob.glob(os.path.join(path[:-6], "subagents", "*.jsonl"))):
        meta_path = f[:-6] + ".meta.json"
        meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
        rows = [d for d in read_jsonl(f) if d.get("timestamp")]
        if not rows:
            continue
        for d in rows:
            if d.get("type") == "assistant":
                claude_assistant(d, sess, ts(d["timestamp"]))
        claude_actor(rows, sess)
        times = [ts(d["timestamp"]) for d in rows]
        sess.agents.append((min(times), max(times), meta.get("agentType", "unknown")))
    return sess


def load_codex(sid):
    hits = glob.glob(os.path.join(CODEX, "**", f"rollout-*{sid}.jsonl"), recursive=True)
    if not hits:
        sys.exit(f"Codex 세션 기록을 찾지 못함: {sid}")
    sess = Session("codex", sid)
    model = None
    for d in read_jsonl(hits[0]):
        if not d.get("timestamp"):
            continue
        t = ts(d["timestamp"])
        sess.stamps.append(t)
        kind, p = d.get("type"), d.get("payload") or {}
        if kind == "turn_context":
            model = (p.get("model") or "").split("/")[-1]
        elif kind == "response_item" and p.get("type") == "message" and p.get("role") == "user":
            text = " ".join(x.get("text", "") for x in p.get("content") or [])
            if not text.lstrip().startswith(CODEX_INJECTED):
                sess.prompts.append(Prompt(t, p.get("id") or d["timestamp"], text))
        elif kind == "response_item" and p.get("type") == "web_search_call":
            sess.searches.append(t)
        elif kind == "response_item" and p.get("type") in ("function_call", "custom_tool_call"):
            sess.tools.append((t, str(p.get("arguments") or p.get("input") or "")))
        elif kind == "event_msg" and p.get("type") == "task_complete":
            sess.busy.append((datetime.fromtimestamp(p["started_at"], timezone.utc),
                               datetime.fromtimestamp(p["completed_at"], timezone.utc)))
        elif kind == "token_usage_record":
            u = p.get("usage") or {}
            cached, written = u.get("cached_input_tokens", 0), u.get("cache_write_input_tokens", 0)
            sess.requests.append(Request(
                t=t, key=f"{p.get('turn_id')}#{d.get('ordinal')}", model=model or "unknown",
                # Codex의 input_tokens는 캐시 읽기·쓰기를 포함한 총량이다. 쓰기 TTL은 기록에 없어 5분으로 본다.
                input=max(u.get("input_tokens", 0) - cached - written, 0),
                cache_write_5m=written, cache_read=cached, output=u.get("output_tokens", 0),
            ))
    return sess


LOADERS = {"claude-code": load_claude, "codex": load_codex}
_cache = {}


def load(runtime, sid):
    if (runtime, sid) not in _cache:
        _cache[(runtime, sid)] = LOADERS[runtime](sid)
    return _cache[(runtime, sid)]


# ---------- 집계 ----------

def request_cost(r, pricing):
    p = pricing["models"].get(r.model)
    if p is None:
        return None
    prompt = r.input + r.cache_write_5m + r.cache_write_1h + r.cache_read
    if p.get("long_prompt_over") and prompt > p["long_prompt_over"]:
        p = {**p, **p["long"]}
    m = pricing["cache_write_multiplier"]
    usd = (r.input * p["input"] + r.cache_write_5m * p["input"] * m["5m"]
           + r.cache_write_1h * p["input"] * m["1h"] + r.cache_read * p["cache_read"]
           + r.output * p["output"]) / 1e6
    return usd * (pricing["fast_multiplier"] if r.fast else 1)


def union_s(spans):
    total, end = 0.0, None
    for a, b in sorted(spans):
        if end is None or a > end:
            total += (b - a).total_seconds()
            end = b
        elif b > end:
            total += (b - end).total_seconds()
            end = b
    return total


def within(t, seg, until=None):
    if seg.get("from") and t < ts(seg["from"]):
        return False
    if seg.get("to") and t > ts(seg["to"]):
        return False
    return until is None or t <= until


def clip(span, seg, until=None):
    """일한 구간을 집계 창(from~to, 첫 배포 시각)으로 잘라 낸다. 창 밖이면 None."""
    a, b = span
    lo = ts(seg["from"]) if seg.get("from") else a
    his = [x for x in (ts(seg["to"]) if seg.get("to") else None, until) if x is not None]
    hi = min(his) if his else b
    a, b = max(a, lo), min(b, hi)
    return (a, b) if a < b else None


def collapse_resends(prompts):
    """수십 초 안에 거의 같은 문장을 다시 보낸 것은 한 번의 지시로 본다(뒤의 것을 남기고 앞 id를 merged에 둔다)."""
    kept, dropped = [], 0
    for p in prompts:
        if kept:
            prev = kept[-1]
            close = (p.t - prev.t).total_seconds() <= RESEND_WINDOW_S
            similar = difflib.SequenceMatcher(None, prev.text, p.text).ratio() >= RESEND_SIMILARITY
            if close and similar:
                kept[-1] = Prompt(p.t, p.id, p.text, prev.merged + [prev.id])
                dropped += 1
                continue
        kept.append(p)
    return kept, dropped


def measure(item, pricing, until=None):
    prompts, requests, busy, agents, approvals, tools, searches, stamps = [], {}, [], [], [], [], [], []
    for seg in item["segments"]:
        sess = load(seg.get("runtime", "claude-code"), seg["session"])
        ok = lambda t: within(t, seg, until)
        prompts += [p for p in sess.prompts if ok(p.t)]
        requests.update({r.key: r for r in sess.requests if ok(r.t)})
        busy += [c for c in (clip(s, seg, until) for s in sess.busy) if c]
        agents += [a for a in sess.agents if ok(a[0])]
        approvals += [a for a in sess.approvals if ok(a[0])]
        tools += [x for x in sess.tools if ok(x[0])]
        searches += [t for t in sess.searches if ok(t)]
        stamps += [t for t in sess.stamps if ok(t)]
    if not stamps:
        sys.exit(f"{item['slug']}: 집계 창에 걸리는 기록이 없음. items.json의 from/to/first_release_to를 확인")

    excluded = set(item.get("exclude") or [])
    prompts = sorted((p for p in prompts if not any(p.id.startswith(e) for e in excluded)), key=lambda p: p.t)
    prompts, resent = collapse_resends(prompts)

    corrections = item.get("corrections")
    n_corr = None
    if corrections is not None:
        hit = lambda p, c: any(i.startswith(c) for i in [p.id, *p.merged])
        if until is None:
            stray = [c for c in corrections if not any(hit(p, c) for p in prompts)]
            if stray:
                sys.exit(f"{item['slug']}: corrections에 집계 구간 밖 프롬프트 {stray}")
        n_corr = sum(1 for p in prompts if any(hit(p, c) for c in corrections))

    usage = defaultdict(Counter)
    web = len(searches)
    cost, unpriced = web * pricing["web_search_per_1k"] / 1000, Counter()
    for r in requests.values():
        usage[r.model].update(input=r.input, cache_write_5m=r.cache_write_5m, cache_write_1h=r.cache_write_1h,
                              cache_read=r.cache_read, output=r.output, requests=1)
        web += r.web_search
        cost += r.web_search * pricing["web_search_per_1k"] / 1000
        c = request_cost(r, pricing)
        if c is None:
            unpriced[r.model] += 1
        else:
            cost += c

    ai_s = union_s(busy)
    agent_sum_s = sum((b - a).total_seconds() for a, b in busy)
    start = prompts[0].t if prompts else min(stamps)
    end = max(stamps)
    clicks = len(prompts)
    total_out = sum(v["output"] for v in usage.values()) or 1
    return {
        "elapsed_ms": int((end - start).total_seconds() * 1000),
        "ai_work_ms": int(ai_s * 1000),
        "agent_sum_ms": int(agent_sum_s * 1000),
        "parallelism": round(agent_sum_s / ai_s, 2) if ai_s else None,
        "clicks": clicks,
        "resends_merged": resent,
        "corrections": n_corr,
        "approvals": len(approvals),
        "approval_wait_ms": int(sum(w for _, w in approvals) * 1000),
        "input_chars": sum(len(p.text) for p in prompts),
        "ai_ms_per_click": int(ai_s * 1000 / clicks) if clicks else None,
        "subagents": len(agents),
        "subagent_types": dict(Counter(k for _, _, k in agents)),
        "tool_calls": len(tools),
        "aside_exec_calls": sum(1 for _, c in tools if "aside exec" in c),
        "web_search_requests": web,
        "models": sorted(({"model": m, "requests": v["requests"], "output_tokens": v["output"],
                           "output_share": round(v["output"] / total_out, 3)} for m, v in usage.items()),
                         key=lambda r: -r["output_tokens"]),
        "tokens": {k: sum(v[k] for v in usage.values())
                   for k in ("input", "cache_write_5m", "cache_write_1h", "cache_read", "output")},
        "cost_usd_api_equiv": round(cost, 2),
        "unpriced_models": dict(unpriced),
        "period": {"from": iso(start), "to": iso(end)},
        "runtimes": sorted({s.get("runtime", "claude-code") for s in item["segments"]}),
        "sessions": len(item["segments"]),
    }


def build_item(slug, item, pricing):
    item = {**item, "slug": slug}
    r = measure(item, pricing)
    out = {
        "slug": slug,
        "measured_at": iso(datetime.now(timezone.utc)),
        "pricing_as_of": pricing["as_of"],
        "scope": "에이전트 세션 기록(본체+서브에이전트). aside exec 등 외부 실행의 LLM 비용은 미포함",
        **r,
        "made": item.get("made"),
        "used": item.get("used"),
        "revisions": item.get("revisions"),
    }
    if item.get("first_release_to"):
        fr = measure(item, pricing, until=ts(item["first_release_to"]))
        out["first_release"] = {k: fr[k] for k in ("elapsed_ms", "ai_work_ms", "clicks", "corrections",
                                                   "input_chars", "cost_usd_api_equiv")}
    return out


# ---------- 명령 ----------

STAMP = re.compile(r'"timestamp":\s*"([^"]+)"')
CODEX_USER = re.compile(r'"type":\s*"message",\s*"role":\s*"user".*?"text":\s*"((?:[^"\\]|\\.){0,40})')
HUMAN_LINE = {
    "claude-code": lambda line: re.search(r'"origin":\s*\{"kind":\s*"human"', line) is not None,
    "codex": lambda line: bool((m := CODEX_USER.search(line))
                               and not json.loads(f'"{m.group(1)}"').lstrip().startswith(CODEX_INJECTED)),
}

def cmd_find(args):
    rows = []
    for runtime, pattern in (("claude-code", os.path.join(CLAUDE, "*", "*.jsonl")),
                             ("codex", os.path.join(CODEX, "**", "rollout-*.jsonl"))):
        for f in glob.glob(pattern, recursive=True):
            # 후보 나열에는 첫·마지막 시각과 대략의 사람 입력 수만 필요하다. 전체 파싱 없이 한 번 훑는다.
            hits, stamps, humans = Counter(), [], 0
            with open(f, encoding="utf-8", errors="ignore") as fh:
                for line in fh:
                    for k in args.keywords:
                        if k in line:
                            hits[k] += 1
                    m = STAMP.search(line)
                    if m:
                        stamps.append(m.group(1))
                    humans += HUMAN_LINE[runtime](line)
            if hits and stamps:
                sid = os.path.basename(f)[:-6]
                rows.append((min(stamps), max(stamps), runtime, sid[-36:] if runtime == "codex" else sid,
                             humans, os.path.basename(os.path.dirname(f)), dict(hits)))
    for a, b, runtime, sid, n, where, hits in sorted(rows):
        print(f"{a[:16]} ~ {b[:16]}  {runtime:<11} {sid}  딸깍≈{n:>3}  {where}  {hits}")


def cmd_prompts(args):
    prompts = load(args.runtime, args.session).prompts
    # items.json에 적을 id는 세션 안에서 겹치지 않는 가장 짧은 앞부분(최소 8자)
    n = 8
    while len({p.id[:n] for p in prompts}) < len(prompts) and n < 64:
        n += 1
    for p in prompts:
        text = " ".join(p.text.split())
        print(f"{iso(p.t)}  {p.id[:n]}  {len(text):>5}자  {text[:args.width]}")


def fmt_ms(ms):
    m = (ms or 0) // 60000
    return f"{m // 60}시간 {m % 60}분" if m >= 60 else f"{m}분"


# ---------- 목록 페이지 반영 ----------
# 분야 목록 HTML의 <!-- metrics:슬러그 --> ... <!-- /metrics:슬러그 --> 사이를 다시 쓴다.

def model_name(m):
    parts = m.removeprefix("claude-").split("-")
    return f"{parts[0].capitalize()} {'.'.join(parts[1:])}".strip()


def unit_small(text):
    return re.sub(r"(\d+)(시간|분)", r"\1<small>\2</small>", text)


def percent_shares(models):
    """화면용 정수 %: 합은 100, 0보다 큰 비율은 최소 1%(반올림으로 0%가 보이지 않게)."""
    raw = [m["output_share"] * 100 for m in models]
    out = [max(1, int(v)) if v > 0 else 0 for v in raw]
    order = sorted(range(len(raw)), key=lambda i: raw[i] - int(raw[i]), reverse=True)
    i = 0
    while sum(out) < 100 and order:
        out[order[i % len(order)]] += 1
        i += 1
    while sum(out) > 100:
        j = max((k for k in range(len(out)) if out[k] > 1), key=lambda k: out[k])
        out[j] -= 1
    return out


def render_entry(r):
    usd = r["cost_usd_api_equiv"]
    # 첫 배포 기록이 있으면 딸깍 칸을 "첫 배포 -> 지금"으로 보여 준다(가장 센 숫자를 큰 칸에)
    if "first_release" in r:
        clicks = (f'{r["first_release"]["clicks"]}<small class="to">→</small>{r["clicks"]}',
                  "딸깍 (첫 배포 → 지금)")
    else:
        clicks = (str(r["clicks"]), "딸깍")
    stats = [
        clicks,
        # 큰 숫자 칸에서는 단위 글자를 작게 둬 숫자만 읽히게 한다
        (unit_small(fmt_ms(r["ai_work_ms"])), "소요 시간"),
        (f"${usd:,.0f}" if usd >= 10 else f"${usd:,.2f}", "API 정가 환산"),
        (str(r["subagents"]), "서브에이전트"),
    ]
    # 큰 숫자 네 칸 아래는 이름표-값 칸으로 나눠 한 줄로 늘어지지 않게 한다
    facts = []
    if r["corrections"] is not None:
        facts.append(("교정", f"{r['corrections']}번"))
    facts.append(("입력", f"{r['input_chars']:,}자"))
    facts.append(("딸깍당 소요", fmt_ms(r["ai_ms_per_click"])))
    # 소요 시간(AI가 일한 시간)과 헷갈리지 않게 시작부터 끝까지 걸린 시간도 둔다
    facts.append(("경과", fmt_ms(r["elapsed_ms"])))
    models = r["models"]
    facts.append(("모델", model_name(models[0]["model"]) if len(models) == 1 else
                  "<br>".join(f"{model_name(m['model'])} {p}%" for m, p in zip(models, percent_shares(models)))))
    cells = "".join(f'<span class="stat"><b>{v}</b>{k}</span>' for v, k in stats)
    made = (f'<span class="fact made"><span class="k">만든 것</span>{r["made"]}</span>'
            if r.get("made") else "")
    # 만든 것이 실제로 어디에 쓰였는지를 바로 아래 줄에 짝으로 둔다
    used = (f'<span class="fact used"><span class="k">쓰임</span>{r["used"]}</span>'
            if r.get("used") else "")
    rest = "".join(f'<span class="fact"><span class="k">{k}</span>{v}</span>' for k, v in facts)
    return (f'<span class="ledger"><span class="stats">{cells}</span>'
            f'<span class="facts">{made}{used}{rest}</span></span>')


def render_page(page, results):
    path = os.path.join(REPO, page)
    html = open(path, encoding="utf-8").read()
    for slug, r in results.items():
        pat = re.compile(rf"(<!-- metrics:{re.escape(slug)} -->).*?(<!-- /metrics:{re.escape(slug)} -->)", re.S)
        if not pat.search(html):
            print(f"  ({page}에 metrics:{slug} 표식이 없어 건너뜀)")
            continue
        html = pat.sub(lambda m: m.group(1) + render_entry(r) + m.group(2), html)
    measured = max(r["measured_at"] for r in results.values())[:10]
    html = re.sub(r"(<!-- metrics:asof -->).*?(<!-- /metrics:asof -->)",
                  lambda m: m.group(1) + measured + m.group(2), html, flags=re.S)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)


def cmd_build(args):
    pricing = json.load(open(PRICING))
    manifest = json.load(open(MANIFEST))
    by_page = defaultdict(dict)
    for slug in args.slugs or list(manifest["items"]):
        item = manifest["items"][slug]
        r = build_item(slug, item, pricing)
        dest = os.path.join(REPO, item.get("dir", f"frontend/{slug}"), "metrics.json")
        by_page[item.get("page", "frontend/index.html")][slug] = r
        if not args.dry_run:
            with open(dest, "w", encoding="utf-8") as f:
                json.dump(r, f, ensure_ascii=False, indent=2)
                f.write("\n")
        corr = "미분류" if r["corrections"] is None else r["corrections"]
        models = " · ".join(f"{m['model'].removeprefix('claude-')} {m['output_share']:.0%}" for m in r["models"])
        print(f"== {slug}{'' if args.dry_run else '  -> ' + os.path.relpath(dest, REPO)}")
        print(f"  경과 {fmt_ms(r['elapsed_ms'])} · AI 작업 {fmt_ms(r['ai_work_ms'])}"
              f" (에이전트 누적 {fmt_ms(r['agent_sum_ms'])}, 병렬 {r['parallelism']}배)")
        print(f"  딸깍 {r['clicks']} (교정 {corr}, 재전송 합침 {r['resends_merged']}) · 입력 {r['input_chars']:,}자"
              f" · 딸깍당 {fmt_ms(r['ai_ms_per_click'])}"
              f" · 승인 {r['approvals']}회(대기 {fmt_ms(r['approval_wait_ms'])})")
        print(f"  {models} · 서브에이전트 {r['subagents']} · 도구 호출 {r['tool_calls']:,}"
              f" · aside exec {r['aside_exec_calls']} · {'+'.join(r['runtimes'])}")
        print(f"  ${r['cost_usd_api_equiv']:,} (API 정가 환산)"
              + (f"  가격 미등록 모델 {r['unpriced_models']}" if r["unpriced_models"] else ""))
        if "first_release" in r:
            fr = r["first_release"]
            print(f"  첫 배포까지: 딸깍 {fr['clicks']} · AI 작업 {fmt_ms(fr['ai_work_ms'])}"
                  f" · ${fr['cost_usd_api_equiv']:,}")
    if not args.dry_run:
        for page, results in by_page.items():
            render_page(page, results)
            print(f"-> {page} 갱신")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("find")
    p.add_argument("keywords", nargs="+")
    p.set_defaults(fn=cmd_find)
    p = sp.add_parser("prompts")
    p.add_argument("session")
    p.add_argument("--runtime", choices=list(LOADERS), default="claude-code")
    p.add_argument("--width", type=int, default=90)
    p.set_defaults(fn=cmd_prompts)
    p = sp.add_parser("build")
    p.add_argument("slugs", nargs="*")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(fn=cmd_build)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
