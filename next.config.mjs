/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서버 없이 HTML 파일로만 내보낸다(Cloudflare Pages 정적 배포). 산출물은 out/
  output: 'export',
  // 기존 주소 규칙(/frontend/처럼 슬래시로 끝남)과 맞춘다
  trailingSlash: true,
  images: { unoptimized: true },
  // 개발 서버가 AGENTS.md를 자동으로 만들지 않게 한다(같은 안내는 CLAUDE.md에 있다)
  agentRules: false,
};

export default nextConfig;
