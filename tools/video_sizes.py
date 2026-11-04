"""배포 산출물의 mp4 크기 목록을 functions/video-sizes.json으로 쓴다.

Pages Function은 정적 파일 응답에서 Content-Length를 받지 못해 Range(206)의 전체 크기를 알 수 없다.
그래서 배포 직전에 실제로 올릴 파일에서 크기를 재서 Function에 같이 묶는다.
사용: python3 tools/video_sizes.py <dist 디렉터리>
"""
import json
import sys
from pathlib import Path

dist = Path(sys.argv[1]).resolve()
sizes = {"/" + p.relative_to(dist).as_posix(): p.stat().st_size for p in sorted(dist.rglob("*.mp4"))}
out = Path(__file__).resolve().parents[1] / "functions" / "video-sizes.json"
out.write_text(json.dumps(sizes, ensure_ascii=False, indent=0) + "\n")
print(f"video-sizes.json: {len(sizes)}개")
