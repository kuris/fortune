# 운세야 놀자 (fortune.chatgpts.kr) 🔮

재미와 자기성찰을 위한 일일 무료 운세 웹 서비스 **"운세야 놀자"**의 정적 웹 애플리케이션 저장소입니다.

## ✨ 주요 기능

1. **☀️ 오늘의 종합 운세 (`today.html`)**
   - 날짜 기반 시드 알고리즘(PRNG)을 통해 매일 고유한 운세 조합 자동 산출
   - 오늘의 키워드, 총운, 연애운, 금전운, 직장운, 공부운, 조심할 점, 오늘의 작은 행동, 행운의 색 & 숫자, 오늘의 한마디 제공
   - 같은 날짜에는 새로고침해도 동일한 결과 유지, 자정이 지나면 자동 갱신

2. **🐭 띠별 오늘의 운세 (`zodiac.html`)**
   - 쥐띠부터 돼지띠까지 12간지 띠별 일일 흐름 및 조언
   - 개별 띠 상세 카드 및 12띠 전체 운세 모아보기 토글 지원

3. **⭐ 별자리 오늘의 운세 (`star.html`)**
   - 양자리부터 물고기자리까지 12별자리별 분위기 및 행운 요소 카드

4. **🃏 오늘의 타로 (`tarot.html`)**
   - 메이저 아르카나 22장 (0. The Fool ~ 21. The World) 완전 구현
   - 3D 플립 애니메이션 카드 덱 인터랙션 및 다시 뽑기 지원

5. **💘 오늘의 연애운 (`love.html`)**
   - 4가지 관계 상태(솔로, 썸, 연애중, 이별후)에 따른 따뜻한 심리 조언 및 작은 행동 제안

6. **📂 내 운세함 & Supabase 구글 로그인 (`login.html`)**
   - 비로그인 상태: 모든 운세 100% 무료 자유 이용
   - 로그인 상태: 오늘 본 운세/타로 결과 보관, 내 띠 & 별자리 즐겨찾기 저장 및 관리

## 🛠️ 기술 스택

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript (ES6+)
- **Font**: Google Fonts (`Jua`, `Gowun Dodum`)
- **Backend / Auth**: Supabase Auth (Google OAuth)
- **Deployment**: Vercel / GitHub Pages 호환 정적 웹 (No Server, Zero Dependency)
- **Monetization & Analytics**: Google AdSense, Vercel Analytics

## 📜 콘텐츠 안내문

> ※ 운세야 놀자의 모든 운세 콘텐츠는 재미와 자기성찰을 위한 참고용입니다.
> 실제 미래, 건강, 금전, 법률, 진로, 인간관계를 단정하거나 보장하지 않습니다.
> 중요한 결정은 현실적인 정보와 전문가의 조언을 함께 참고해 주세요.
