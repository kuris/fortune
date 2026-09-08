/* ============================================================
   운세야 놀자! - Supabase 접속 상수 (supabase-config.js)

   - 값은 기존 script.js 안에서 이미 사용 중인 것과 100% 동일합니다.
     (URL / publishable 키 / 인증 storageKey)
     script.js 는 IIFE 라 외부에서 값을 꺼낼 수 없어, 같은 값을 이 파일에
     한 번만 선언해 두고 track.js 와 admin 화면이 공유합니다.
   - publishable(anon) 키는 브라우저에 공개되어도 되는 키입니다.
     실제 데이터 보호는 Supabase RLS 가 담당합니다. (supabase/migration-admin.sql)

   ※ 이 파일은 "상수 선언"만 합니다.
      Supabase 클라이언트를 만들지 않으므로, 기존 script.js 의 인증 클라이언트와
      절대 충돌하지 않습니다.
   ============================================================ */

(function () {
  if (typeof window === 'undefined') return;
  window.SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co';
  window.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1';
  window.SUPABASE_AUTH_STORAGE_KEY = 'sb-fortune-auth-token';   // 기존 script.js 와 동일
})();
