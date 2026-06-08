"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { css } from "_panda/css";
import {
  signInSchema,
  genderSchema,
  armySchema,
  type User,
} from "@hgt-client/contract";
import { api, ApiError } from "@/lib/api";

const fieldCss = css({ display: "flex", flexDirection: "column", gap: "1" });
const labelCss = css({ fontSize: "sm", fontWeight: "medium", color: "gray.700" });
const inputCss = css({
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  padding: "2",
  fontSize: "md",
});

type FormState = {
  name: string;
  studentId: string;
  major: string;
  age: string;
  gender: string;
  army: string;
};

const initialForm: FormState = {
  name: "",
  studentId: "",
  major: "",
  age: "",
  gender: "남",
  army: "필",
};

export default function SignInPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [session, setSession] = useState<string | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(", "));
      return;
    }

    setLoading(true);
    try {
      const { session: newSession } = await api.signIn(parsed.data);
      setSession(newSession);
      setUsers(await api.getUsers(newSession));
      if (typeof window !== "undefined") {
        localStorage.setItem("hgt_session", newSession);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.status}: ${err.message}` : "요청 실패",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={css({
        maxWidth: "480px",
        margin: "0 auto",
        padding: "8",
        display: "flex",
        flexDirection: "column",
        gap: "6",
      })}
    >
      <h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>
        로그인 / 회원가입
      </h1>

      <form
        onSubmit={onSubmit}
        className={css({ flexDirection: "column", gap: "4" })}
      >
        <div className={fieldCss}>
          <label className={labelCss}>이름</label>
          <input
            className={inputCss}
            value={form.name}
            onChange={update("name")}
            placeholder="홍길동"
          />
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>학번</label>
          <input
            className={inputCss}
            value={form.studentId}
            onChange={update("studentId")}
            placeholder="2020123456"
          />
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>학과</label>
          <input
            className={inputCss}
            value={form.major}
            onChange={update("major")}
            placeholder="컴퓨터공학"
          />
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>나이</label>
          <input
            className={inputCss}
            value={form.age}
            onChange={update("age")}
            inputMode="numeric"
            placeholder="24"
          />
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>성별</label>
          <select
            className={inputCss}
            value={form.gender}
            onChange={update("gender")}
          >
            {genderSchema.options.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>군필 여부</label>
          <select
            className={inputCss}
            value={form.army}
            onChange={update("army")}
          >
            {armySchema.options.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={css({
            bg: "black",
            color: "white",
            padding: "3",
            borderRadius: "md",
            fontWeight: "semibold",
            cursor: "pointer",
            _disabled: { opacity: 0.5, cursor: "not-allowed" },
          })}
        >
          {loading ? "처리 중..." : "로그인 / 가입"}
        </button>
      </form>

      {error && (
        <p className={css({ color: "red.600", fontSize: "sm" })}>⚠️ {error}</p>
      )}

      {session && (
        <section
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2",
            padding: "4",
            bg: "gray.50",
            borderRadius: "md",
          })}
        >
          <p className={css({ fontSize: "sm", color: "gray.600" })}>
            세션 발급됨
          </p>
          <code className={css({ fontSize: "xs", wordBreak: "break-all" })}>
            {session}
          </code>
        </section>
      )}

      {users && (
        <section
          className={css({ display: "flex", flexDirection: "column", gap: "2" })}
        >
          <h2 className={css({ fontSize: "lg", fontWeight: "semibold" })}>
            가입 유저 ({users.length})
          </h2>
          <ul
            className={css({ display: "flex", flexDirection: "column", gap: "1" })}
          >
            {users.map((u) => (
              <li
                key={u.id}
                className={css({ fontSize: "sm", display: "flex", gap: "2" })}
              >
                <span className={css({ fontWeight: "medium" })}>{u.name}</span>
                <span className={css({ color: "gray.500" })}>
                  {u.major} · {u.age}세 · {u.gender ? "남" : "여"} ·{" "}
                  {u.army ? "군필" : "미필"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
