/**
 * Seed the catalogs (idempotent, re-runnable):
 *   - keywords: self/ideal matching keywords by category
 *   - properties: profile attribute options (height / smoke / religion / mbti)
 *
 *   pnpm --filter api db:seed
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { keywords, properties } from "../src/db/schema";

const KEYWORDS: Record<string, string[]> = {
  성격: [
    "활발한", "차분한", "다정한", "유머러스한", "솔직한", "내향적인", "외향적인",
    "계획적인", "즉흥적인", "경청하는", "긍정적인", "감성적인", "이성적인",
    "배려심많은", "호기심많은", "리더형", "꼼꼼한", "느긋한", "열정적인", "엉뚱한",
  ],
  취미: [
    "영화감상", "음악감상", "카페투어", "전시관람", "운동", "등산", "러닝", "헬스",
    "게임", "독서", "사진", "요리", "여행", "드라이브", "공연·콘서트", "노래방",
    "베이킹", "그림", "악기연주", "캠핑", "보드게임", "클라이밍", "수영", "자전거", "댄스",
  ],
  관심사: [
    "패션", "디자인", "개발·IT", "재테크", "반려동물", "환경", "봉사", "외국어",
    "맛집탐방", "커피", "와인", "미술", "건강·웰빙", "자기계발", "심리학",
    "우주·과학", "역사", "경제", "스타트업", "인테리어",
  ],
  라이프스타일: [
    "아침형", "저녁형", "집순이·집돌이", "액티비티파", "술자리좋아함", "운동매니아",
    "미니멀", "채식지향", "혼밥잘함", "계획여행", "즉흥여행", "야행성",
  ],
  가치관: [
    "진지한연애", "가벼운만남", "결혼지향", "친구처럼", "자기계발중시", "가정적",
    "자유로운관계", "모험적인", "안정추구", "성장지향", "일과삶균형",
  ],
};

const PROPERTIES: Record<string, string[]> = {
  height: [
    "160cm 이하", "161~165cm", "166~170cm", "171~175cm", "176~180cm", "181~185cm", "186cm 이상",
  ],
  smoke: ["비흡연", "흡연", "가끔 피움", "전자담배"],
  religion: ["무교", "기독교", "천주교", "불교", "원불교", "기타"],
  mbti: [
    "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
  ],
};

async function main() {
  const kwRows = Object.entries(KEYWORDS).flatMap(([category, values]) =>
    values.map((value) => ({ value, category })),
  );
  await db.insert(keywords).values(kwRows).onConflictDoNothing({ target: keywords.value });

  const propRows = Object.entries(PROPERTIES).flatMap(([type, values]) =>
    values.map((value) => ({ type, value })),
  );
  await db.insert(properties).values(propRows).onConflictDoNothing();

  const [kwCount, propCount] = await Promise.all([db.$count(keywords), db.$count(properties)]);
  console.log(
    `✅ seeded — keywords: ${kwCount} (${Object.keys(KEYWORDS).length} categories), ` +
      `properties: ${propCount} (${Object.keys(PROPERTIES).length} types)`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
