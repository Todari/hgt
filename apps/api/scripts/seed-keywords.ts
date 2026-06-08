/**
 * Seed the curated keyword catalog. Idempotent (re-runnable).
 *
 *   pnpm --filter api db:seed
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { keywords } from "../src/db/schema";

const CATALOG: Record<string, string[]> = {
  성격: [
    "활발한", "차분한", "다정한", "유머러스한", "솔직한", "내향적인",
    "외향적인", "계획적인", "즉흥적인", "경청하는", "긍정적인", "감성적인",
  ],
  취미: [
    "영화감상", "음악감상", "카페투어", "전시관람", "운동", "등산", "러닝",
    "헬스", "게임", "독서", "사진", "요리", "여행", "드라이브", "공연·콘서트", "노래방",
  ],
  관심사: [
    "패션", "디자인", "개발·IT", "재테크", "반려동물", "환경", "봉사",
    "외국어", "맛집탐방", "커피", "와인", "미술",
  ],
  라이프스타일: [
    "아침형", "저녁형", "집순이·집돌이", "액티비티파", "술자리좋아함",
    "술안마심", "비흡연", "운동매니아", "미니멀",
  ],
  가치관: [
    "진지한연애", "가벼운만남", "결혼지향", "친구처럼", "자기계발중시",
    "가정적", "자유로운", "모험적인",
  ],
};

async function main() {
  const rows = Object.entries(CATALOG).flatMap(([category, values]) =>
    values.map((value) => ({ value, category })),
  );
  await db.insert(keywords).values(rows).onConflictDoNothing({ target: keywords.value });
  const total = await db.$count(keywords);
  console.log(`✅ seeded keyword catalog — ${total} keywords across ${Object.keys(CATALOG).length} categories`);
  process.exit(0);
}

main().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
