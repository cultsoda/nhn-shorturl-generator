# NHN Cloud ShortURL 대량 생성기

NHN Cloud의 ShortURL 서비스를 활용하여 최대 100개의 URL을 한 번에 단축URL로 변환하는 웹 애플리케이션입니다.

## 주요 기능

- **UTM 생성 + Short URL**: 원본 URL에 UTM 파라미터를 추가한 후 단축URL 생성
- **완성된 URL → Short URL**: 이미 완성된 URL을 바로 단축URL로 변환
- **대량 처리**: 최대 100개 URL 일괄 처리
- **UTM 파라미터 관리**: 전역 설정 또는 개별 설정 가능
- **결과 다운로드**: CSV 파일로 결과 다운로드
- **실시간 미리보기**: URL 변환 전 미리보기 제공

## 기술 스택

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Icons**: Lucide React
- **Deployment**: Vercel

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start