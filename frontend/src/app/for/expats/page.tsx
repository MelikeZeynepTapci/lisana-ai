import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisana.app";

export const metadata: Metadata = {
  title: "AI Language Tutor for Expats: Learn the Language Before You Land | Lisana",
  description:
    "Lisana is the AI language app built for expats. Practice real-life scenarios like Anmeldung, job interviews, and flat hunting with Maya, your personal AI tutor. German, Spanish, French, Italian, English.",
  openGraph: {
    title: "AI Language Tutor for Expats: Learn the Language Before You Land | Lisana",
    description:
      "Practice the real conversations expats actually need, including Anmeldung, job interviews, flat hunting, and doctor visits, with Maya, your personal AI language coach.",
    url: `${siteUrl}/for/expats`,
    type: "website",
    siteName: "Lisana",
    images: [
      {
        url: "/og-expats.png",
        width: 1200,
        height: 630,
        alt: "Lisana AI Language Tutor for Expats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Language Tutor for Expats | Lisana",
    description:
      "Practice real expat conversations including Anmeldung, job interviews, and flat hunting with Maya your AI tutor.",
    images: ["/og-expats.png"],
  },
  alternates: {
    canonical: `${siteUrl}/for/expats`,
  },
};

const painPoints = [
  {
    icon: "gavel",
    iconBg: "bg-error-container",
    iconColor: "text-error",
    title: "Bureaucracy is terrifying when you don't speak the language.",
    body: "Anmeldung, Bürgeramt, residence permits, health insurance forms. None of it is in English. Generic language apps teach you 'the cat is on the mat'. Lisana teaches you to navigate the actual system you're living in.",
  },
  {
    icon: "business_center",
    iconBg: "bg-warning-container",
    iconColor: "text-warning",
    title: "Work integration takes years without active language practice.",
    body: "You can survive in English at the international office, but you'll always be the outsider in hallway conversations, team lunches, and informal meetings. The language gap is also a career gap.",
  },
  {
    icon: "groups",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    title: "Social isolation is the hidden cost of not speaking locally.",
    body: "Friendships, neighborhood belonging, and understanding jokes. None of this happens without the local language. Most expats live in an expat bubble for years because breaking into local social life requires fluency.",
  },
  {
    icon: "payments",
    iconBg: "bg-secondary-container",
    iconColor: "text-secondary",
    title: "Good tutors cost €50–80 per hour. And you need dozens of hours.",
    body: "One private lesson a week is not enough practice to build fluency. You need daily repetitions, and private tutors are simply too expensive for that frequency. Lisana gives you unlimited daily practice at a fraction of the cost.",
  },
];

const howMayaHelps = [
  {
    icon: "location_on",
    title: "Location-aware scenarios",
    body: "Tell Maya you're in Berlin, Vienna, or Madrid and she shifts to city-specific vocabulary and scenarios. Practice Anmeldung in German or flat-viewing conversations in Spanish rather than generic textbook dialogues.",
  },
  {
    icon: "trending_up",
    title: "CEFR progress tracking",
    body: "Maya tracks your level in real time. If you need B1 for a German integration course or B2 for a work visa, she tells you exactly how far you are and what to focus on. No vague progress bars. Real level data.",
  },
  {
    icon: "newspaper",
    title: "Daily news in your target language",
    body: "Read and listen to CEFR-adapted news from your city and country every day. Learn the vocabulary that locals actually use, covering regional politics, local events, and cultural references rather than tourist phrases.",
  },
];

const testimonials = [
  {
    quote:
      "I moved to Berlin with almost no German. I practiced my Anmeldung appointment with Maya three times before I went and sailed through it. For the first time in six months I felt like I actually knew what was happening.",
    name: "Fatima A.",
    role: "Turkish expat in Berlin, relocated for work",
  },
  {
    quote:
      "Vienna is a beautiful city but incredibly difficult to integrate into without German. Maya helped me practice everything, including doctor appointments, talking to my landlord, and even small talk with colleagues. My German improved more in two months with Lisana than in a year of evening classes.",
    name: "Arjun M.",
    role: "Indian software engineer in Vienna",
  },
  {
    quote:
      "As a Brazilian expat in Amsterdam I needed both English and Dutch. I started with English to handle my work life, and Maya was exactly what I needed: real conversation practice, not grammar exercises. She remembers every session and every mistake.",
    name: "Isabela C.",
    role: "Brazilian expat in Amsterdam",
  },
];

const languages = [
  {
    flag: "🇩🇪",
    name: "German",
    slug: "german",
    context: "Germany, Austria, Switzerland",
    note: "Essential for Anmeldung, integration courses, and the job market",
  },
  {
    flag: "🇪🇸",
    name: "Spanish",
    slug: "spanish",
    context: "Spain, Latin America",
    note: "500M+ speakers, key for expat life across 20+ countries",
  },
  {
    flag: "🇫🇷",
    name: "French",
    slug: "french",
    context: "France, Belgium, Switzerland, Africa",
    note: "Required for daily life in France and Francophone countries",
  },
  {
    flag: "🇮🇹",
    name: "Italian",
    slug: "italian",
    context: "Italy, Switzerland",
    note: "Europe's most popular expat destination where the local language is essential",
  },
];

const faqs = [
  {
    q: "How fast can I reach B1 German for a visa or integration course?",
    a: "Most learners reach B1 in 4–6 months with 20–30 minutes of daily practice. Lisana's CEFR tracking tells you your current level after every session and shows you exactly what gap you need to close. Many of our users preparing for integration course entry tests have reached B1 in under 5 months.",
  },
  {
    q: "Is Lisana good for Anmeldung German?",
    a: "Yes, specifically. Maya includes scenario-based practice for Anmeldung, Bürgeramt visits, health insurance registration, and other bureaucratic situations specific to Germany and Austria. You can practice the exact phrases and questions you'll face in the real appointment.",
  },
  {
    q: "Can I practice job interview German or Spanish with Lisana?",
    a: "Absolutely. Maya has a dedicated professional scenarios category including job interviews, workplace introductions, team meetings, email writing, and negotiation. You can practice a mock job interview and receive feedback on your vocabulary, fluency, and professionalism.",
  },
  {
    q: "Does Lisana work for expats who are complete beginners?",
    a: "Yes. Lisana supports A1 level from day one. Maya speaks slowly with simple vocabulary, introduces new words in context, and scales up gradually. Even if you've just landed and speak zero German, Maya can guide you from your very first German sentences.",
  },
  {
    q: "Can I use Lisana to practice multiple languages at once?",
    a: "Yes. Each language has its own independent progress tracker, vocabulary list, CEFR level, and Maya history. If you're an expat who needs both German and English, you can practice both without any interference. Many expats use Lisana to maintain their English while learning the local language.",
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

export default function ForExpatsPage() {
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
                href="/for/students"
                className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 hidden sm:block"
              >
                For Students
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
            <span className="material-symbols-outlined ms-filled text-[14px]">flight_land</span>
            Built for expats, immigrants, and people who just relocated
          </div>
          <h1 className="font-lexend font-bold text-4xl md:text-5xl text-on-surface leading-tight mb-6">
            The language app built for expats.
          </h1>
          <p className="font-manrope text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-10">
            Not vocabulary drills. Not gamified streaks. Real conversations for real situations: Anmeldung,
            job interviews, flat hunting, and doctor visits. Maya is your personal AI language coach
            who knows your city and your goals.
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
            No credit card · All levels A1–C1 · German, Spanish, French, Italian, English
          </p>
        </section>

        {/* PAIN POINTS */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
                Why language learning is different for expats.
              </h2>
              <p className="font-manrope text-base text-on-surface-variant mt-3 max-w-xl mx-auto">
                You&apos;re not learning a language as a hobby. You need it to live.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {painPoints.map((p) => (
                <div key={p.title} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm flex gap-4">
                  <div className={`w-10 h-10 ${p.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined ms-filled text-[20px] ${p.iconColor}`}>{p.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{p.title}</h3>
                    <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW MAYA HELPS */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
              How Maya helps you integrate. Not just learn.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {howMayaHelps.map((h) => (
              <div key={h.title} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                <div className="w-10 h-10 bg-primary-container rounded-2xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined ms-filled text-[20px] text-primary">{h.icon}</span>
                </div>
                <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{h.title}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl text-on-surface">
                Expats who found their voice with Lisana.
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

        {/* LANGUAGES FOR EXPATS */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl text-on-surface">
              Languages for expats.
            </h2>
            <p className="font-manrope text-base text-on-surface-variant mt-3 max-w-xl mx-auto">
              Each language is tuned for real expat life in the countries where it&apos;s spoken.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {languages.map((lang) => (
              <Link
                key={lang.slug}
                href={`/learn/${lang.slug}`}
                className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm hover:shadow-ambient-md transition-shadow flex gap-4 group"
              >
                <div className="text-4xl flex-shrink-0">{lang.flag}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-lexend font-bold text-base text-on-surface">{lang.name}</h3>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                  <p className="font-manrope text-xs text-primary font-semibold mb-1">{lang.context}</p>
                  <p className="font-manrope text-sm text-on-surface-variant">{lang.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl text-on-surface">
                Common questions about expat language learning.
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
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-24 px-6 text-center" style={{ background: "linear-gradient(135deg, #E8437A 0%, #F97316 100%)" }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="font-lexend font-bold text-4xl md:text-5xl text-white mb-4">
              Start before you land.
            </h2>
            <p className="font-manrope text-base text-white/80 mb-10">
              The sooner you start, the less overwhelming your first weeks will be. One conversation with Maya takes two minutes.
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
              No credit card required · All levels · German, Spanish, French, Italian, English
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
              <Link href="/for/students" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                For Students
              </Link>
              <Link href="/learn/german" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Learn German
              </Link>
              <Link href="/learn/spanish" className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Learn Spanish
              </Link>
            </div>
            <p className="font-manrope text-xs text-on-surface-variant">© 2026 Lisana · Vienna, Austria</p>
          </div>
        </footer>

      </div>
    </>
  );
}
