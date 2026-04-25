## Insurance Interface Hub Prototype

보험사 금융 IT 인터페이스 통합관리시스템 프론트엔드입니다. Next.js 대시보드가 Spring Boot 관리 API와 연결되어 인터페이스 등록, 설정 저장, 모니터링, 재처리 흐름을 보여줍니다.

## Run

1. `backend/demo`에서 Spring Boot 서버를 실행합니다.
2. `frontend`에 `.env.local`을 만들고 아래 값을 넣습니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

3. 프론트 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.
