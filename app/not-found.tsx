import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '페이지 없음 - bkan lab',
};

export default function NotFound() {
  return (
    <>
      <header className="print strip">
        <div className="wrap">
          <h1>404</h1>
          <p className="lede">이 주소에는 페이지가 없습니다. 주소를 다시 확인하거나 처음 화면에서 찾아 주세요.</p>
        </div>
      </header>
      <main className="wrap section">
        <ul className="shelf">
          <li>
            <Link href="/">
              <span className="name">bkan lab 처음으로</span>
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
