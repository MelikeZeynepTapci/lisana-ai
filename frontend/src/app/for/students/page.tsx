import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisana.app";

export const metadata: Metadata = {
  title: "AI Language Practice for International Students: IELTS, TestDAF & More | Lisana",
  description:
    "Lisana helps international and ERASMUS students pass IELTS, TestDAF, DELE, and DELF. Practice speaking with Maya, your AI tutor. Available 24/7 at a fraction of the cost of private lessons.",
  openGraph: {
    title: "AI Language Practice for International Students: IELTS, TestDAF & More | Lisana",
    description:
      "Prepare for IELTS, TestDAF, DELE, or DELF with Maya, your AI speaking coach. Built for international and ERASMUS students. Daily practice, targeted feedback, budget-friendly.",
    url: `${siteUrl}/for/students`,
    type: "website",
    siteName: "Lisana",
    images: [
      {
        url: "/og-students.png",
        width: 1200,
        height: 630,
        alt: "Lisana AI Language Practice for International Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Language Practice for International Students | Lisana",
    description:
      "Prepare for IELTS, TestDAF, DELE, or DELF with Maya your AI speaking coach.",
    images: ["/og-students.png"],
  },
  alternates: {
    canonical: `${siteUrl}/for/students`,
  },
};

const challenges = [
  {
    icon: "menu_book",
    iconBg: "bg-error-container",
    iconColor: "text-error",
    title: "You're dropped into a new country with no language support.",
    body: "Most universities provide language classes only once or twice a week. That's not enough to reach the fluency you need for seminars, group projects, and daily campus life. You need daily practice, not weekly lectures.",
  },
  {
    icon: "timer",
    iconBg: "bg-warning-container",
    iconColor: "text-warning",
    title: "Exam preparation takes targeted, repeated speaking practice.",
    body: "IELTS, TestDAF, DELE, and DELF all have demanding speaking sections. Most students practice once a week with a language partner or tutor. That's nowhere near enough repetitions to build confident, fluent responses.",
  },
  {
    icon: "euro",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    title: "Private tutors cost €40–80/hour on a student budget.",
    body: "Even one lesson a week costs €160–320 per month. That's rent for some students. Lisana gives you unlimited daily speaking practice with an AI tutor that remembers everything, at €15/month on Pro or completely free.",
  },
  {
    icon: "psychology",
    iconBg: "bg-secondary-container",
    iconColor: "text-secondary",
    title: "Speaking anxiety is real. It stops progress.",
    body: "Many international students understand a language well but freeze when speaking. Practicing with Maya privately, with no judgment and infinite patience, is proven to build the confidence needed for real-world speaking.",
  },
];

const exams = [
  {
    flag: "🇬🇧",
    name: "IELTS",
    language: "English",
    slug: "english",
    description: "Maya simulates all three IELTS Speaking parts and evaluates your responses on fluency, coherence, lexical resource, and grammatical range. These are the exact IELTS criteria.",
    targetScore: "Band 7.0+ preparation",
  },
  {
    flag: "🇩🇪",
    name: "TestDAF",
    language: "German",
    slug: "german",
    description: "Practice TestDAF speaking sections with Maya. She gives feedback on your TDN level, vocabulary precision, and argument structure, all critical for TestDAF success.",
    targetScore: "TDN 4+ preparation",
  },
  {
    flag: "🇪🇸",
    name: "DELE",
    language: "Spanish",
    slug: "spanish",
    description: "Prepare for DELE B2 or C1 speaking sections. Maya runs structured monologues, dialogues, and debates aligned with DELE formats and gives rubric-based feedback.",
    targetScore: "DELE B2/C1 preparation",
  },
  {
    flag: "🇫🇷",
    name: "DELF / DALF",
    language: "French",
    slug: "french",
    description: "Practice DELF and DALF speaking tasks with Maya. From structured oral presentations to spontaneous debates, she prepares you for every format in the exam.",
    targetScore: "DELF B2 / DALF C1 preparation",
  },
];

const features = [
  {
    icon: "auto_awesome",
    iconBg: "bg-primary-container",
    iconColor: "text-primary",
    title: "Targeted feedback from Maya",
    body: "Maya doesn't just chat. She evaluates. After every practice session she gives you specific feedback on vocabulary range, grammatical accuracy, fluency, and coherence. These are the same dimensions your exam is scored on.",
  },
  {
    icon: "track_changes",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    title: "CEFR level tracking",
    body: "Lisana tracks your speaking level in real time against the CEFR framework (A1–C1). If you need B2 for your university admission or C1 for a scholarship, Maya shows you exactly where you are and what to practice.",
  },
  {
    icon: "mic",
    iconBg: "bg-secondary-container",
    iconColor: "text-secondary",
    title: "Pronunciation assessment",
    body: "Daily pronunciation exercises scored on accuracy, fluency, and completeness, powered by Azure Pronunciation Assessment. Perfect for students who need to sound natural in seminars and presentations.",
  },
  {
    icon: "newspaper",
    iconBg: "bg-surface-highest",
    iconColor: "text-on-surface",
    title: "CEFR-adapted daily news",
    body: "Read and listen to real news articles adapted to your level every day. Build the academic and current-affairs vocabulary that appears in IELTS, TestDAF, and DELE reading and speaking sections.",
  },
];

const testimonials = [
  {
    quote:
      "My IELTS band score went from 6.0 to 7.5 in six weeks. Maya simulates the speaking test exactly and gives feedback on every single turn. My university offer required 7.0 and I hit it with margin.",
    name: "Marco L.",
    role: "IELTS candidate → MSc Computer Science, University of Edinburgh",
  },
  {
    quote:
      "As an ERASMUS student in Vienna, I needed German fast. LinguaRooms is the only place I found other students at exactly my level to practice with. The AI feedback after each session is incredibly useful.",
    name: "Yuki T.",
    role: "ERASMUS student in Vienna, from Tokyo",
  },
  {
    quote:
      "I was preparing for TestDAF TDN 4 for my German university admission. Maya ran practice sessions every day, tracking my weaknesses and always knowing what to focus on. I passed on my first attempt.",
    name: "Sun L.",
    role: "Chinese student, TestDAF preparation in Berlin",
  },
];

const faqs = [
  {
    q: "Can I prepare for IELTS speaking with Lisana?",
    a: "Yes. Maya can run all three parts of the IELTS Speaking test, including Part 1 (general questions), Part 2 (long turn monologue), and Part 3 (discussion), and evaluate your responses against the official IELTS band descriptors. Many Lisana users have increased their band score by 0.5–1.5 through daily practice.",
  },
  {
    q: "Is Lisana good for TestDAF preparation?",
    a: "Yes. TestDAF is one of the most demanding German language exams. Maya can practice the oral expression section in TestDAF format, give feedback on your TDN (TestDAF-Niveaustufe) level, and help you reach TDN 4, the standard requirement for German university admission. We recommend combining Lisana with official TestDAF sample materials.",
  },
  {
    q: "How is Lisana different from a university language tandem partner?",
    a: "Tandem partners are great but limited. Availability, scheduling, and level-matching are constant issues. Maya is available 24/7, never cancels, matches your exact level, and gives structured feedback rather than casual conversation. For exam preparation in particular, the structured practice and explicit feedback Maya gives is far more valuable than unstructured tandem exchanges.",
  },
  {
    q: "Does Lisana work for students who are absolute beginners in the local language?",
    a: "Yes. Lisana supports A1 beginners. Maya speaks slowly, uses simple vocabulary, and guides you step by step. For ERASMUS students who arrive with zero knowledge of the local language, Lisana is an efficient way to reach survival level (A2) within a few weeks.",
  },
  {
    q: "Is there a student discount?",
    a: "The free plan is fully functional and generous: 3 AI conversation sessions per day, daily pronunciation exercises, and vocabulary practice. For unlimited practice, the Pro plan is €15/month or €120/year. We're working on verified student pricing. Sign up to be notified.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function ForStudentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-background">

        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-outline-variant/20">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/landing" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined ms-filled text-[18px] text-white">language</span>
              </div>
              <span className="font-lexend font-bold text-base text-on-surface">
                Lisana <span className="text-primary">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/for/expats"
                className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 hidden sm:block"
              >
                For Expats
              </Link>
              <Link
                href="/demo/setup"
                className="font-manrope font-bold text-sm text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #E8437A 0%, #F97316 100%)" }}
              >
                Start Free
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-container/40 text-primary font-manrope font-semibold text-xs px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined ms-filled text-[14px]">school</span>
            For international students and ERASMUS participants
          </div>
          <h1 className="font-lexend font-bold text-4xl md:text-5xl text-on-surface leading-tight mb-6">
            AI language practice built for international students.
          </h1>
          <p className="font-manrope text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-10">
            Prepare for IELTS, TestDAF, DELE, or DELF. Survive your first semester in a new country.
            Practice the academic language you actually need with Maya, your AI tutor who gives
            real feedback, not just a passing grade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo/setup"
              className="font-manrope font-bold text-base text-white px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #E8437A 0%, #F97316 100%)", boxShadow: "0 8px 24px rgba(232,67,122,0.30)" }}
            >
              Try Maya Free. No Signup.
            </Link>
            <Link
              href="/signup"
              className="font-manrope font-bold text-base border-2 border-outline text-on-surface px-8 py-4 rounded-full hover:bg-surface-low transition-colors"
            >
              Create Free Account →
            </Link>
          </div>
          <p className="font-manrope text-xs text-on-surface-variant mt-4">
            No credit card · IELTS, TestDAF, DELE, DELF · All levels A1–C1
          </p>
        </section>

        {/* CHALLENGES */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
                The challenges every international student faces.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((c, i) => (
                <div key={i} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm flex gap-4">
                  <div className={`w-10 h-10 ${c.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined ms-filled text-[20px] ${c.iconColor}`}>{c.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{c.title}</h3>
                    <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EXAM PREPARATION */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
              Exam preparation with Maya.
            </h2>
            <p className="font-manrope text-base text-on-surface-variant mt-3 max-w-xl mx-auto">
              Maya is trained on the speaking rubrics and formats of the world&apos;s most common language exams.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div key={exam.name} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{exam.flag}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-lexend font-bold text-lg text-on-surface">{exam.name}</h3>
                      <span className="font-manrope text-xs text-primary bg-primary-container/40 px-2.5 py-0.5 rounded-full font-semibold">
                        {exam.language}
                      </span>
                    </div>
                    <span className="font-manrope text-xs text-tertiary font-semibold">{exam.targetScore}</span>
                  </div>
                </div>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-4">{exam.description}</p>
                <Link
                  href={`/learn/${exam.slug}`}
                  className="font-manrope font-semibold text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Learn {exam.language} with Lisana
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
                Built for students who need results, not streaks.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm flex gap-4">
                  <div className={`w-10 h-10 ${f.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined ms-filled text-[20px] ${f.iconColor}`}>{f.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{f.title}</h3>
                    <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING NOTE */}
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="bg-surface-lowest rounded-4xl p-10 shadow-ambient-sm border border-outline-variant/20 max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-primary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined ms-filled text-[24px] text-primary">savings</span>
            </div>
            <h2 className="font-lexend font-bold text-2xl text-on-surface mb-3">
              One tutor session costs more than a month of Lisana.
            </h2>
            <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-6">
              A private language tutor costs €40–80/hour. Lisana Pro is €15/month, with unlimited daily practice,
              Maya&apos;s long-term memory, and pronunciation scoring. For students on a budget, the difference is undeniable.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center mb-8">
              <div className="bg-error-container/30 rounded-2xl p-4">
                <p className="font-lexend font-bold text-2xl text-error mb-1">€200+</p>
                <p className="font-manrope text-xs text-on-surface-variant">5 private tutor sessions / month</p>
              </div>
              <div className="bg-tertiary-container/40 rounded-2xl p-4">
                <p className="font-lexend font-bold text-2xl text-tertiary mb-1">€15</p>
                <p className="font-manrope text-xs text-on-surface-variant">Lisana Pro: unlimited sessions</p>
              </div>
            </div>
            <Link
              href="/demo/setup"
              className="font-manrope font-bold text-base text-white px-8 py-4 rounded-full hover:opacity-90 transition-opacity inline-block"
              style={{ background: "linear-gradient(135deg, #E8437A 0%, #F97316 100%)" }}
            >
              Start Free. No Credit Card.
            </Link>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl text-on-surface">
                Students who passed with Lisana.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined ms-filled text-[16px] text-secondary">star</span>
                    ))}
                  </div>
                  <p className="font-manrope text-sm text-on-surface leading-relaxed mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-manrope font-bold text-sm text-on-surface">{t.name}</p>
                    <p className="font-manrope text-xs text-on-surface-variant">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl text-on-surface">
              Questions from international students.
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-2">{faq.q}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-24 px-6 text-center" style={{ background: "linear-gradient(135deg, #E8437A 0%, #F97316 100%)" }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="font-lexend font-bold text-4xl md:text-5xl text-white mb-4">
              Start practicing today.
            </h2>
            <p className="font-manrope text-base text-white/80 mb-10">
              One conversation with Maya. No credit card. No account needed. See why thousands of students choose Lisana for exam prep and study abroad preparation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo/setup"
                className="font-manrope font-bold text-base bg-white text-on-surface px-10 py-4 rounded-full hover:bg-white/90 transition-colors shadow-ambient-xl"
              >
                Try Maya Free →
              </Link>
              <Link
                href="/signup"
                className="font-manrope font-bold text-base bg-white/20 text-white border-2 border-white/40 px-10 py-4 rounded-full hover:bg-white/30 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
            <p className="font-manrope text-xs text-white/60 mt-4">
              No credit card required · IELTS, TestDAF, DELE, DELF · All levels
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-background border-t border-outline-variant/20 py-10 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/landing" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined ms-filled text-[15px] text-white">language</span>
              </div>
              <span className="font-lexend font-bold text-sm text-on-surface">Lisana <span className="text-primary">AI</span></span>
            </Link>
            <div className="flex gap-4">
              <Link href="/for/expats" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                For Expats
              </Link>
              <Link href="/learn/english" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Learn English
              </Link>
              <Link href="/learn/german" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Learn German
              </Link>
            </div>
            <p className="font-manrope text-xs text-on-surface-variant">© 2026 Lisana · Vienna, Austria</p>
          </div>
        </footer>

      </div>
    </>
  );
}
