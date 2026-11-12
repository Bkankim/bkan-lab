import { Fragment, type ReactNode } from 'react';
import type { Metrics } from '@/lib/site';

function fmtMs(ms: number): string {
  const m = Math.floor((ms || 0) / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

function modelName(model: string): string {
  const parts = model.replace(/^claude-/, '').split('-');
  const head = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  return `${head} ${parts.slice(1).join('.')}`.trim();
}

/** 화면용 정수 %: 합은 100, 0보다 큰 비율은 최소 1%(반올림으로 0%가 보이지 않게) */
function percentShares(models: Metrics['models']): number[] {
  const raw = models.map((m) => m.output_share * 100);
  const frac = (i: number) => raw[i] - Math.trunc(raw[i]);
  const out = raw.map((v) => (v > 0 ? Math.max(1, Math.trunc(v)) : 0));
  const order = raw.map((_, i) => i).sort((a, b) => frac(b) - frac(a));
  const sum = () => out.reduce((a, b) => a + b, 0);
  for (let i = 0; sum() < 100 && order.length > 0; i++) out[order[i % order.length]] += 1;
  while (sum() > 100) {
    let j = -1;
    out.forEach((v, k) => {
      if (v > 1 && (j === -1 || v > out[j])) j = k;
    });
    if (j === -1) break;
    out[j] -= 1;
  }
  return out;
}

/** 큰 숫자 칸에서는 단위 글자를 작게 둬 숫자만 읽히게 한다 */
function Duration({ ms }: { ms: number }) {
  const parts = fmtMs(ms).split(/(\d+(?:시간|분))/).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^(\d+)(시간|분)$/.exec(part);
        return m ? (
          <Fragment key={i}>
            {m[1]}
            <small>{m[2]}</small>
          </Fragment>
        ) : (
          part
        );
      })}
    </>
  );
}

function usdText(usd: number): string {
  if (usd < 10) return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // 옛 파이썬 표기(f"{usd:,.0f}")와 같게 정확히 .5인 값은 짝수 쪽으로 반올림한다(12.5 -> 12, 13.5 -> 14)
  const floor = Math.floor(usd);
  const rest = usd - floor;
  const rounded = rest > 0.5 || (rest === 0.5 && floor % 2 === 1) ? floor + 1 : floor;
  return `$${rounded.toLocaleString('en-US')}`;
}

/** 만드는 데 든 것: 큰 숫자 네 칸 + 이름표 칸 */
export function Ledger({ r }: { r: Metrics }) {
  const shares = percentShares(r.models);
  const facts: [string, ReactNode][] = [];
  if (r.corrections !== null) facts.push(['교정', `${r.corrections}번`]);
  facts.push(['입력', `${r.input_chars.toLocaleString('en-US')}자`]);
  facts.push(['딸깍당 소요', fmtMs(r.ai_ms_per_click)]);
  // 소요 시간(AI가 일한 시간)과 헷갈리지 않게 시작부터 끝까지 걸린 시간도 둔다
  facts.push(['경과', fmtMs(r.elapsed_ms)]);
  facts.push([
    '모델',
    r.models.length === 1
      ? modelName(r.models[0].model)
      : r.models.map((m, i) => (
          <Fragment key={m.model}>
            {i > 0 && <br />}
            {`${modelName(m.model)} ${shares[i]}%`}
          </Fragment>
        )),
  ]);
  return (
    <span className="ledger">
      <span className="stats">
        {/* 첫 배포 기록이 있으면 딸깍 칸을 "첫 배포 -> 지금"으로 보여 준다 */}
        {r.first_release ? (
          <span className="stat">
            <b>
              {r.first_release.clicks}
              <small className="to">→</small>
              {r.clicks}
            </b>
            딸깍 (첫 배포 → 지금)
          </span>
        ) : (
          <span className="stat">
            <b>{r.clicks}</b>딸깍
          </span>
        )}
        <span className="stat">
          <b>
            <Duration ms={r.ai_work_ms} />
          </b>
          소요 시간
        </span>
        <span className="stat">
          <b>{usdText(r.cost_usd_api_equiv)}</b>API 정가 환산
        </span>
        <span className="stat">
          <b>{r.subagents}</b>서브에이전트
        </span>
      </span>
      <span className="facts">
        {r.made && (
          <span className="fact made">
            <span className="k">만든 것</span>
            {r.made}
          </span>
        )}
        {r.used && (
          <span className="fact used">
            <span className="k">쓰임</span>
            {r.used}
          </span>
        )}
        {facts.map(([k, v]) => (
          <span className="fact" key={k}>
            <span className="k">{k}</span>
            {v}
          </span>
        ))}
      </span>
    </span>
  );
}
