/**
 * 검색 페이지: 로그인 전에 보류되는 사용자 액션 (인증 후 재개)
 */
export type SearchPendingAction =
  | { type: "nearby" }
  | { type: "location"; location: string }
  | { type: "placeChanged" }
  | { type: "select"; placeId: string; name: string; url?: string; address?: string };
