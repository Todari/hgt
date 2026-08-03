const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/signin";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HGT",
  alternateName: "홍익대 인증 키워드 매칭",
  url: "https://hgt.todari.dev",
  description:
    "검증된 홍익대 구성원과 매주 한 번, 사진 대신 취향과 키워드로 만나는 1:1 매칭 서비스.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  creator: {
    "@type": "Organization",
    name: "Todari",
    url: "https://todari.dev",
  },
  featureList: [
    "홍익대학교 구성원 인증",
    "키워드 기반 프로필",
    "매주 한 사람 1:1 매칭",
    "실시간 채팅",
  ],
};

const problems = [
  {
    number: "01",
    old: "누구인지 알 수 없는 프로필",
    next: "홍익대 포털 인증",
    body: "재학·휴학·졸업 상태를 확인한 홍익대 구성원만 들어올 수 있어요. 같은 학교라는 최소한의 신뢰에서 시작합니다.",
    color: "blue",
  },
  {
    number: "02",
    old: "끝없이 넘기는 사람들",
    next: "매주 새로운 한 사람",
    body: "한 번에 수십 명을 보여주지 않아요. 매주 월요일 저녁 7시, 이번 주에 알아갈 단 한 사람을 소개합니다.",
    color: "yellow",
  },
  {
    number: "03",
    old: "사진 한 장으로 내리는 판단",
    next: "취향과 태도를 담은 키워드",
    body: "겉모습보다 어떤 사람인지 먼저 볼 수 있도록, 나와 원하는 상대를 표현한 키워드로 연결합니다.",
    color: "mint",
  },
] as const;

const steps = [
  [
    "VERIFY",
    "홍익대 인증",
    "포털 계정으로 학적을 확인해요. 비밀번호는 저장하지 않아요.",
  ],
  [
    "KEYWORDS",
    "키워드 선택",
    "나를 표현하고, 원하는 상대를 설명하는 키워드를 골라요.",
  ],
  [
    "MON 19:00",
    "한 사람 공개",
    "매주 월요일 저녁 7시, 이번 주의 인연을 확인해요.",
  ],
  [
    "TALK",
    "진지한 대화",
    "함께 고른 키워드에서 시작해 한 사람을 천천히 알아가요.",
  ],
] as const;

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="HGT 홈">
          <span className="brand-mark">H</span>
          <span>HGT</span>
        </a>
        <nav className="site-nav" aria-label="페이지 메뉴">
          <a href="#why">왜 HGT인가요</a>
          <a href="#how">이용 방법</a>
        </nav>
        <a className="button button-small button-ink" href={APP_URL}>
          시작하기 ↗
        </a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            HONGIK VERIFIED · 1:1 MATCH
          </p>
          <h1 id="hero-title">
            이번 주에는,
            <br />
            <span className="marker">단 한 사람만.</span>
          </h1>
          <p className="hero-description">
            검증된 홍익대 구성원과 매주 한 번.
            <br />
            사진 대신 취향과 키워드로 만나요.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={APP_URL}>
              홍익대 인증하고 시작하기
              <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#why">
              우리가 다른 이유 ↓
            </a>
          </div>
          <ul className="hero-proof" aria-label="HGT 특징">
            <li>✓ 홍익대 포털 인증</li>
            <li>✓ 매주 1명 소개</li>
            <li>✓ 프로필 사진 없음</li>
          </ul>
        </div>

        <div className="ticket-stage" aria-label="HGT 매칭 티켓 예시">
          <span className="sticker sticker-trust">VERIFIED!</span>
          <span className="sticker sticker-one">ONLY ONE</span>
          <article className="match-ticket">
            <div className="ticket-top">
              <div>
                <p className="ticket-kicker">HGT WEEKLY MATCH</p>
                <p className="ticket-number">NO. 07</p>
              </div>
              <span className="ticket-seal">H</span>
            </div>
            <div className="ticket-person">
              <p>이번 주의 한 사람</p>
              <strong>김홍익 님</strong>
              <span>시각디자인과 · 24세</span>
            </div>
            <div className="keyword-cloud">
              <span>#솔직한</span>
              <span>#산책을좋아하는</span>
              <span>#연락이잘되는</span>
              <span>#천천히가까워지는</span>
            </div>
            <div className="ticket-bottom">
              <div>
                <small>REVEAL</small>
                <strong>MON · 19:00</strong>
              </div>
              <span className="barcode" aria-hidden="true">
                ||| || |||| | ||
              </span>
            </div>
          </article>
          <p className="stage-note">사진보다 먼저, 사람을 봅니다.</p>
        </div>
      </section>

      <section className="manifesto" aria-label="HGT 선언">
        <p>
          소개팅 앱은 많지만,
          <br />
          <strong>믿고 한 사람을 알아갈 곳</strong>은 부족했습니다.
        </p>
        <span aria-hidden="true">↘</span>
      </section>

      <section
        className="why section-shell"
        id="why"
        aria-labelledby="why-title"
      >
        <div className="section-heading">
          <p className="section-index">01 / WHY HGT</p>
          <h2 id="why-title">
            만남의 시작부터
            <br />
            다시 설계했어요.
          </h2>
          <p>
            더 많은 선택지가 더 좋은 만남을 만들지는 않았어요. HGT는 신뢰, 집중,
            사람 자체라는 세 가지 기준에서 시작합니다.
          </p>
        </div>

        <div className="problem-grid">
          {problems.map((problem) => (
            <article
              className={`problem-card ${problem.color}`}
              key={problem.number}
            >
              <div className="problem-number">{problem.number}</div>
              <div className="comparison">
                <p>
                  <span>기존 앱</span>
                  <del>{problem.old}</del>
                </p>
                <span className="comparison-arrow" aria-hidden="true">
                  ↓
                </span>
                <p>
                  <span>HGT</span>
                  <strong>{problem.next}</strong>
                </p>
              </div>
              <p className="problem-body">{problem.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="no-photo" aria-labelledby="no-photo-title">
        <div className="no-photo-copy">
          <p className="section-index light">02 / NO PROFILE PHOTO</p>
          <h2 id="no-photo-title">
            사진은 빼고,
            <br />
            사람은 더 봅니다.
          </h2>
          <p>
            어떤 모습인지보다 어떤 사람인지 먼저 알고 싶었어요. 생활 방식,
            관심사, 대화의 온도와 관계를 대하는 태도가 한 사람의 프로필이
            됩니다.
          </p>
        </div>
        <div className="keyword-poster" aria-label="키워드로 표현한 프로필">
          <span className="poster-label">THIS IS ME</span>
          <strong>#다정한</strong>
          <strong>#새로운맛집</strong>
          <strong>#집에서도잘노는</strong>
          <strong>#진지한관계</strong>
          <p>이 키워드들이 한 사람을 소개합니다.</p>
        </div>
      </section>

      <section
        className="how section-shell"
        id="how"
        aria-labelledby="how-title"
      >
        <div className="section-heading horizontal">
          <div>
            <p className="section-index">03 / HOW IT WORKS</p>
            <h2 id="how-title">월요일의 한 사람을 만나는 법.</h2>
          </div>
          <p>가입부터 첫 대화까지, 복잡한 탐색과 경쟁은 없어요.</p>
        </div>

        <ol className="step-grid">
          {steps.map(([label, title, body], index) => (
            <li key={label}>
              <div className="step-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>{label}</small>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="trust section-shell" aria-labelledby="trust-title">
        <div className="trust-stamp" aria-hidden="true">
          SAFE
          <br />
          START
        </div>
        <div>
          <p className="section-index">04 / TRUST &amp; SAFETY</p>
          <h2 id="trust-title">설렘보다 먼저, 안전을 확인합니다.</h2>
          <p>
            포털 비밀번호는 저장하지 않고 인증에만 사용합니다. 불편한 상대는
            언제든 차단·신고할 수 있고, 전화번호와 민감한 개인정보가 채팅에
            노출되지 않도록 보호합니다.
          </p>
        </div>
        <ul>
          <li>포털 비밀번호 미저장</li>
          <li>차단·신고 기능</li>
          <li>개인정보 메시지 필터</li>
        </ul>
      </section>

      <section className="final-cta" id="start" aria-labelledby="cta-title">
        <p>MONDAY · 19:00</p>
        <h2 id="cta-title">
          다음 월요일의
          <br />한 사람을 만나보세요.
        </h2>
        <a className="button button-ink button-large" href={APP_URL}>
          홍익대 인증하고 시작하기 <span aria-hidden="true">↗</span>
        </a>
        <span className="cta-sticker" aria-hidden="true">
          SEE YOU
          <br />
          MONDAY!
        </span>
      </section>

      <footer>
        <a className="brand" href="#top">
          <span className="brand-mark">H</span>
          <span>HGT</span>
        </a>
        <p>홍익대 인증 키워드 매칭</p>
        <div>
          <a href="mailto:support@hgt.kr">문의</a>
          <span>© 2026 HGT</span>
        </div>
      </footer>
      </main>
    </>
  );
}
