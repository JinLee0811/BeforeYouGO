FROM --platform=linux/amd64 node:20-alpine AS base
WORKDIR /app

# 의존성 설치 단계 (devDependencies 포함)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 빌드 단계
FROM base AS builder
ENV NODE_ENV=production \
  NEXT_PUBLIC_SUPABASE_URL=http://example.com \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 런타임 단계
FROM base AS runner
ENV NODE_ENV=production

# 보안을 위해 non-root 유저 사용
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Next.js 이미지 캐시 디렉터리 생성 및 app 유저 권한 부여
RUN mkdir -p .next/cache/images && chown -R app:app /app

USER app

EXPOSE 3000

CMD ["npm", "start"]

