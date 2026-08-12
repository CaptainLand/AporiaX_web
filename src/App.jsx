import { useEffect, useMemo, useState } from "react";
import ParticleSea from "./ParticleSea.jsx";
import AccountPage from "./account/AccountPage.jsx";
import AuthModal from "./auth/AuthModal.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";

const APORIAX_REPO = "https://github.com/CaptainLand/AporiaX";
const DOWNLOAD_URL = "https://github.com/CaptainLand/AporiaX/releases/latest";
const APP_ICON_URL = "https://raw.githubusercontent.com/CaptainLand/AporiaX/main/public/aporiax-icon.png";
const BASE_URL = import.meta.env.BASE_URL || "/";
const BASE_PATH = BASE_URL === "/" ? "" : BASE_URL.replace(/\/$/, "");

function routeFromPathname(pathname) {
  const relativePath = BASE_PATH && pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;
  return relativePath.startsWith("/account") ? "account" : "home";
}

function withBase(path) {
  if (path === "/") return BASE_URL;
  return `${BASE_PATH}${path}`;
}

const copy = {
  en: {
    nav: ["Product", "Principles", "Download"],
    signin: "Sign in",
    signup: "Create account",
    titleA: "Build. Verify. Ship.",
    titleB: "AporiaX.",
    heroShort: "Local-first · Multi-Agent · Verifiable",
    download: "Download for Windows",
    github: "View on GitHub",
    pillarsTitle: "Not just an answer. A visible path.",
    pillarsLead: "AporiaX is built around three ideas that keep autonomous work understandable and recoverable.",
    principles: [
      { label: "01 · Route", title: "See the work as it happens.", text: "Plans, tool calls, files, commands and agent handoffs become one coherent execution route instead of disappearing behind chat text." },
      { label: "02 · Evidence", title: "Completion needs proof.", text: "Review and verification are tied to the current file versions, so stale checks cannot silently validate newer code." },
      { label: "03 · Anchor", title: "Move fast without losing the way back.", text: "Workspace checkpoints preserve the task boundary and make changes reviewable, conflict-aware and recoverable across turns." },
    ],
    systemTitle: "An agent runtime, not a chat shell.",
    systemLead: "Planning, tools, subagents, self-check and project understanding share one lifecycle. The model can propose completion; the Harness decides whether the work is actually ready.",
    features: [
      ["Adaptive multi-agent", "Explore, Review, Verify and Curator workers are delegated only when the task justifies them."],
      ["Parallel Builders", "Large write tasks can split into isolated Git worktrees with scoped ownership and a shared integration contract."],
      ["Progressive self-check", "Changed file versions are reviewed with concrete evidence before the final result can be sealed."],
      ["Project Understanding", "Reusable architecture, conventions, commands and debugging knowledge can survive beyond a single conversation."],
      ["Local execution", "Commands run in a temporary local workspace copy, with an optional Docker sandbox for stronger isolation."],
      ["Skills, MCP & Browser", "Native tools and extensions enter one capability system with visible permissions and observable actions."],
    ],
    routeTitle: "What a task feels like",
    routeLead: "One request. One route. Every important transition stays visible.",
    routeSteps: [
      ["Understand", "Inspect the workspace and build a plan"],
      ["Act", "Read, edit, run tools and delegate focused work"],
      ["Review", "Independent workers inspect the latest changes"],
      ["Verify", "Run the checks that materially prove the result"],
      ["Deliver", "Return the outcome, evidence and recoverable Anchor"],
    ],
    ctaEyebrow: "Start locally",
    ctaTitle: "Give your next problem somewhere to begin.",
    ctaLead: "AporiaX is currently a Windows x64 Preview. Bring your own compatible model provider and attach a local workspace.",
    footer: "Local-first agent runtime · MIT licensed",
  },
  zh: {
    nav: ["产品", "理念", "下载"],
    signin: "登录",
    signup: "创建账号",
    titleA: "Build. Verify. Ship.",
    titleB: "AporiaX.",
    heroShort: "本地执行 · 多 Agent · 可验证",
    download: "下载 Windows 版",
    github: "查看 GitHub",
    pillarsTitle: "不只给答案，也留下路径。",
    pillarsLead: "AporiaX 围绕三个原则构建，让自主执行始终可理解、可验证、可恢复。",
    principles: [
      { label: "01 · Route", title: "看见 Agent 正在做什么。", text: "计划、工具调用、文件、命令与 Agent 协作被组织成一条真实执行路径，而不是消失在聊天文字后面。" },
      { label: "02 · Evidence", title: "完成需要证据。", text: "Review 与 Verify 绑定当前文件版本，旧检查不能悄悄为后来修改过的代码背书。" },
      { label: "03 · Anchor", title: "大胆修改，也保留回去的路。", text: "工作区检查点保存任务边界，让修改可以审阅、进行冲突检查，并在跨轮任务中安全恢复。" },
    ],
    systemTitle: "它是 Agent Runtime，不是聊天外壳。",
    systemLead: "规划、工具、子 Agent、自检与项目理解共享同一套生命周期。模型可以认为自己完成了，但真正是否能够结束，由 Harness 的状态与证据决定。",
    features: [
      ["自适应多 Agent", "只有任务确实需要时，才会启用 Explore、Review、Verify 与 Curator。"],
      ["并行 Builder", "大型可写任务可拆进独立 Git worktree，通过作用域与共享契约安全协作。"],
      ["渐进式自检", "每一次修改后的文件版本都必须由真实读取或验证证据覆盖，才能完成封印。"],
      ["Project Understanding", "架构、约定、命令和调试知识可以跨任务沉淀，而不是随对话消失。"],
      ["本地执行", "命令默认在临时工作区副本中运行，也可选择 Docker 获得更强隔离。"],
      ["Skills、MCP 与 Browser", "原生工具与扩展进入统一 Capability 系统，权限与行为都可以被观察。"],
    ],
    routeTitle: "一次任务应该是什么感觉",
    routeLead: "一个请求，一条路径。每个重要阶段都有迹可循。",
    routeSteps: [
      ["Understand", "检查工作区并形成行动计划"],
      ["Act", "读取、编辑、执行工具并委派独立工作"],
      ["Review", "独立 Agent 检查最新修改版本"],
      ["Verify", "执行真正能够证明结果的验证"],
      ["Deliver", "交付结果、证据与可恢复 Anchor"],
    ],
    ctaEyebrow: "从本地开始",
    ctaTitle: "给你的下一个问题，一个开始的地方。",
    ctaLead: "AporiaX 当前提供 Windows x64 Preview。添加兼容的模型 Provider，绑定本地工作区，然后开始第一个任务。",
    footer: "Local-first Agent Runtime · MIT License",
  },
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function BrandLogo() {
  return <img className="brand-logo" src={APP_ICON_URL} alt="" aria-hidden="true" />;
}

export default function App() {
  const { status, account } = useAuth();
  const [language, setLanguage] = useState(() => window.localStorage.getItem("aporia-language") || "en");
  const [modal, setModal] = useState(null);
  const [route, setRoute] = useState(() => routeFromPathname(window.location.pathname));
  const text = copy[language] || copy.en;

  useEffect(() => {
    window.localStorage.setItem("aporia-language", language);
  }, [language]);

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPathname(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const identity = account?.identities?.find((item) => item.type === "email")?.identifier || "";
  const accountName = account?.user?.displayName || identity.split("@")[0] || "Account";
  const accountInitials = useMemo(() => accountName.slice(0, 2).toUpperCase(), [accountName]);

  function navigate(path) {
    const target = withBase(path);
    if (window.location.pathname !== target) window.history.pushState({}, "", target);
    setRoute(path.startsWith("/account") ? "account" : "home");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function openAccount() {
    navigate("/account");
  }

  if (route === "account") {
    return (
      <>
        <AccountPage language={language} setLanguage={setLanguage} onBack={() => navigate("/")} onSignIn={() => setModal("signin")} />
        <AuthModal mode={modal} onClose={() => setModal(null)} language={language} onAuthenticated={openAccount} />
      </>
    );
  }

  return (
    <div className="site-shell">
      <header className="nav-shell">
        <a className="brand" href="#top" aria-label="AporiaX home"><BrandLogo /><span>AporiaX</span></a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#product">{text.nav[0]}</a><a href="#principles">{text.nav[1]}</a><a href="#download">{text.nav[2]}</a>
        </nav>
        <div className="nav-actions">
          <button className="language-toggle" type="button" onClick={() => setLanguage((current) => (current === "en" ? "zh" : "en"))}>{language === "en" ? "中文" : "EN"}</button>
          {status === "authenticated" ? (
            <button className="nav-user-button" type="button" onClick={openAccount}><span>{accountInitials}</span><span>{accountName}</span></button>
          ) : (
            <>
              <button className="nav-text-button" type="button" onClick={() => setModal("signin")}>{text.signin}</button>
              <button className="nav-account-button" type="button" onClick={() => setModal("signup")}>{text.signup}</button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <ParticleSea />
          <div className="hero-content page-width hero-content--split">
            <div className="hero-statement">
              <h1><span>{text.titleA}</span><span className="hero-title-gradient">{text.titleB}</span></h1>
            </div>
            <div className="hero-cta">
              <p className="hero-short">{text.heroShort}</p>
              <div className="hero-actions">
                <a className="button button--primary" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">{text.download}<ArrowIcon /></a>
                <a className="button button--quiet" href={APORIAX_REPO} target="_blank" rel="noreferrer">{text.github}<ArrowIcon /></a>
              </div>
            </div>
          </div>
          <div className="hero-fade" aria-hidden="true" />
        </section>

        <section className="principles section page-width" id="principles">
          <div className="section-heading"><p className="section-kicker">Route · Evidence · Anchor</p><h2>{text.pillarsTitle}</h2><p>{text.pillarsLead}</p></div>
          <div className="principle-grid">
            {text.principles.map((principle) => <article className="principle-card" key={principle.label}><span>{principle.label}</span><h3>{principle.title}</h3><p>{principle.text}</p><div className="principle-line" aria-hidden="true" /></article>)}
          </div>
        </section>

        <section className="system section" id="product">
          <div className="page-width system-layout">
            <div className="system-copy section-heading section-heading--left"><p className="section-kicker">Harness</p><h2>{text.systemTitle}</h2><p>{text.systemLead}</p></div>
            <div className="runtime-card" aria-label="AporiaX task route example">
              <div className="runtime-card__topbar"><div><span className="runtime-live-dot" /><strong>Agent Process</strong></div><span>00:42</span></div>
              <div className="runtime-route">
                {text.routeSteps.map(([title, detail], index) => <div className={`runtime-step ${index < 3 ? "runtime-step--complete" : ""}`} key={title}><span className="runtime-step__index">{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{detail}</p></div><span className="runtime-step__state">{index < 3 ? "done" : index === 3 ? "active" : "next"}</span></div>)}
              </div>
              <div className="runtime-evidence"><span>Evidence</span><code>18 tests passed · 4 files reviewed · Anchor ready</code></div>
            </div>
          </div>
          <div className="page-width feature-grid">
            {text.features.map(([title, description], index) => <article className="feature-card" key={title}><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </section>

        <section className="route-section section page-width">
          <div className="section-heading"><p className="section-kicker">Workflow</p><h2>{text.routeTitle}</h2><p>{text.routeLead}</p></div>
          <div className="route-track">
            {text.routeSteps.map(([title, detail], index) => <article className="route-item" key={title}><div className="route-number">{String(index + 1).padStart(2, "0")}</div><h3>{title}</h3><p>{detail}</p></article>)}
          </div>
        </section>

        <section className="download-section section page-width" id="download">
          <div className="download-card">
            <div className="download-orbit download-orbit--one" aria-hidden="true" /><div className="download-orbit download-orbit--two" aria-hidden="true" />
            <div className="download-copy"><p className="section-kicker">{text.ctaEyebrow}</p><h2>{text.ctaTitle}</h2><p>{text.ctaLead}</p></div>
            <div className="download-actions"><a className="button button--primary" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">{text.download}<ArrowIcon /></a><a className="button button--quiet" href={APORIAX_REPO} target="_blank" rel="noreferrer">GitHub<ArrowIcon /></a></div>
          </div>
        </section>
      </main>

      <footer className="footer page-width">
        <a className="brand brand--footer" href="#top"><BrandLogo /><span>AporiaX</span></a>
        <p>{text.footer}</p>
        <div><a href={APORIAX_REPO} target="_blank" rel="noreferrer">GitHub</a><a href={`${APORIAX_REPO}#readme`} target="_blank" rel="noreferrer">Docs</a><a href={DOWNLOAD_URL} target="_blank" rel="noreferrer">Download</a></div>
      </footer>

      <AuthModal mode={modal} onClose={() => setModal(null)} language={language} onAuthenticated={openAccount} />
    </div>
  );
}
