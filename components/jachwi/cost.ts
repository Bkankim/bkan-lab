// 실제 부담 계산(02 UX 3.2 이름 사전, 4절 원칙 3). 모든 금액 단위는 만원이다.
// 세액공제는 조세특례제한법 제95조의2(2026-09-18 시행본)를 근사로 계산한다. 공제·보험 요율은 2026년 근사치다.

export type CostInput = { deposit: number; rent: number; fee: number; salary: number };

export type CostResult = {
  yearly: number; // 월세 + 관리비 + 보증금 환산((보증금 - 1000) × 6% / 12), 1년
  taxCredit: number; // 세액공제로 실제로 줄어드는 세금(지방세 포함, 표준세액공제 13만원 상실 반영). 청년월세 선정 시 지원금을 뺀 월세 기준
  creditRate: number;
  seoulYouth: number; // 서울시 청년월세(선정되면)
  seoulEligible: boolean;
  moveOnce: number; // 중개보수·이사비 최대(1회)
  netMonthly: number; // 혜택을 뺀 월 부담
  netMonthlyNoYouth: number; // 청년월세 탈락 시
};

function incomeTax(salary: number) {
  const ded = salary <= 1500 ? salary * 0.7 - 350 + 0 : salary <= 4500 ? 750 + (salary - 1500) * 0.15 : 1200 + (salary - 4500) * 0.05;
  const income = salary - Math.max(ded, 0);
  const social = salary * (0.0475 + 0.03595 * 1.1314 + 0.009);
  const base = Math.max(income - 150 - social, 0);
  const brackets: [number, number][] = [[1400, 0.06], [5000, 0.15], [8800, 0.24], [15000, 0.35]];
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of brackets) {
    if (base > prev) tax += (Math.min(base, cap) - prev) * rate;
    prev = cap;
  }
  if (base > 15000) tax += (base - 15000) * 0.38;
  let ec = Math.min(tax, 130) * 0.55 + Math.max(tax - 130, 0) * 0.3;
  const cap = salary <= 3300 ? 74 : salary <= 7000 ? Math.max(74 - (salary - 3300) * 0.008, 66) : Math.max(66 - (salary - 7000) * 0.5, 50);
  ec = Math.min(ec, cap);
  return Math.max(tax - ec, 0);
}

export function computeCost({ deposit, rent, fee, salary }: CostInput): CostResult {
  // 02 UX 3.2 실부담과 같은 식: 보증금 1,000만원 기준으로 (보증금 - 1000) × 6% / 12를 월로 더한다
  const yearly = (rent + fee + ((deposit - 1000) * 0.06) / 12) * 12;
  const creditRate = salary <= 5500 ? 0.17 : salary <= 8000 ? 0.15 : 0;
  const before = Math.max(incomeTax(salary) - 13, 0);
  // 세액공제는 본인이 실제로 낸 월세에만 붙는다. 청년월세 지원금을 받으면 그만큼 뺀 금액이 공제 대상이다
  const creditFor = (paidYear: number) => {
    if (!creditRate) return 0;
    const after = Math.max(incomeTax(salary) - Math.min(paidYear, 1000) * creditRate, 0);
    return Math.max((before - after) * 1.1, 0);
  };
  const conv = (deposit * 0.045) / 12 + rent;
  const seoulEligible = salary / 12 <= 384.7 && deposit <= 8000 && (rent <= 60 || conv <= 90);
  const seoulYouth = seoulEligible ? Math.min(rent, 20) * 12 : 0;
  const taxCreditNoYouth = creditFor(rent * 12);
  const taxCredit = creditFor(rent * 12 - seoulYouth);
  const netMonthly = (yearly - taxCredit - seoulYouth) / 12;
  const netMonthlyNoYouth = (yearly - taxCreditNoYouth) / 12;
  return { yearly, taxCredit, creditRate, seoulYouth, seoulEligible, moveOnce: 40, netMonthly, netMonthlyNoYouth };
}
