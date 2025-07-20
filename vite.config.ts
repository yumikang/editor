import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';

// 🧠 외계어: Remix Vite 설정
// 🍼 사람어: Remix가 Vite랑 잘 연결되게 해주는 필수 코드!

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(), // 🍼 사람어: @components 같은 경로 별명 잘 되게 해주는 플러그인!
  ],

  // ✨ 여기부터 추가 설정들!
  optimizeDeps: {
    include: ['zustand', '@remix-run/react'],
    // 🍼 사람어: 자주 쓰는 도구들을 미리 데워놓기! 앱이 더 빨리 떠요.
  },

  server: {
    fs: {
      allow: ['..'],
      // 🍼 사람어: 이웃 폴더(템플릿 폴더 등)도 보게 해줘!
    },
  },

  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    // 🍼 사람어: "지금 개발 중인지?"를 코드에서 쉽게 확인할 수 있어요!
  },

  envPrefix: ['VITE_', 'SUPABASE_'],
  // 🍼 사람어: `.env`에 있는 변수 중 어떤 걸 써도 되는지 알려주는 설정이에요!
});
