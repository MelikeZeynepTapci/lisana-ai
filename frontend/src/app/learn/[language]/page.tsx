import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// ─── Language data ────────────────────────────────────────────────────────────

type LanguageData = {
  name: string;
  flag: string;
  speakers: string;
  regions: string;
  cta: string;
  why: [string, string, string];
  metaTitle: string;
  metaDescription: string;
  heroSubtitle: string;
  faqs: { q: string; a: string }[];
  testimonials: { quote: string; name: string; role: string }[];
};

const languageData: Record<string, LanguageData> = {
  german: {
    name: "German",
    flag: "🇩🇪",
    speakers: "100 million+",
    regions: "Germany, Austria, Switzerland",
    cta: "Start speaking German today",
    why: [
      "Required for Anmeldung, job applications, and everyday life in Germany and Austria",
      "Over 100 million native speakers across Germany, Austria, and Switzerland",
      "Opens doors to some of Europe's strongest job markets in tech, engineering, and finance",
    ],
    metaTitle: "Learn German Online with AI | Lisana",
    metaDescription:
      "Learn German online with Maya, your personal AI language coach. Practice real conversations for expat life in Germany or Austria, covering Anmeldung, work, and daily life. All levels from A1 to C1.",
    heroSubtitle:
      "Whether you're moving to Berlin, starting a job in Munich, or preparing for your Anmeldung in Vienna, Maya speaks German with you every day and adapts to exactly where you are.",
    faqs: [
      {
        q: "How long does it take to learn German?",
        a: "Most learners reach conversational B1 level in 3–6 months with 20–30 minutes of daily practice. Reaching C1 typically takes 12–18 months. Lisana's daily sessions with Maya, pronunciation drills, and CEFR-tracked progress accelerate this significantly compared to traditional methods.",
      },
      {
        q: "Can I learn German for free with Lisana?",
        a: "Yes. Lisana's free plan includes AI conversation session with Maya per day, daily pronunciation exercises, and vocabulary quizzes. No credit card required. The Pro plan at €15/month unlocks unlimited sessions and Maya's long-term memory.",
      },
      {
        q: "Is Lisana better than Duolingo for German speaking practice?",
        a: "Lisana and Duolingo serve very different goals. Duolingo focuses on gamified vocabulary and reading exercises. Lisana is built entirely around spoken conversation: you speak, Maya responds, corrects, and remembers. If you need to actually speak German in real life, Lisana is the more targeted tool.",
      },
      {
        q: "Can I practice German specifically for living in Germany or Austria?",
        a: "Yes. Maya offers location-aware scenarios for cities including Berlin, Munich, Vienna, and Zurich. You can practice conversations around Anmeldung, job interviews, flat hunting, doctor visits, and supermarket interactions. These cover all the real-life German you actually need.",
      },
      {
        q: "Do I need to know any German to start?",
        a: "Not at all. Lisana supports complete beginners at A1 level. During onboarding you set your starting level, and Maya calibrates her vocabulary, speech pace, and topics accordingly. She'll gently introduce you to German and scale up as you improve.",
      },
    ],
    testimonials: [
      {
        quote:
          "I moved to Berlin and started holding work meetings in German after 6 weeks with Maya. I had tried apps before but nothing prepared me for real conversations like this.",
        name: "Ahmet K.",
        role: "Turkish expat, now living and working in Berlin",
      },
      {
        quote:
          "My Anmeldung appointment was terrifying. I practiced the exact scenario with Maya three times beforehand and sailed through it. The location-specific content is incredibly useful.",
        name: "Priya S.",
        role: "Indian expat in Vienna",
      },
      {
        quote:
          "I had a 300-day Duolingo streak and still couldn't hold a German conversation. Three weeks of daily Maya sessions and I gave my first presentation at work entirely in German.",
        name: "Ji-woo L.",
        role: "South Korean engineer in Munich",
      },
    ],
  },

  spanish: {
    name: "Spanish",
    flag: "🇪🇸",
    speakers: "500 million+",
    regions: "Spain, Latin America",
    cta: "Start speaking Spanish today",
    why: [
      "2nd most spoken language in the world with 500M+ native speakers",
      "Essential for living and working across Spain and Latin America",
      "Consistently ranked among the most valuable career languages globally",
    ],
    metaTitle: "Learn Spanish Online with AI | Lisana",
    metaDescription:
      "Learn Spanish online with Maya, your AI language coach. Practice real conversations for expat life in Spain or Latin America. Daily speaking practice, CEFR tracking, all levels A1–C1.",
    heroSubtitle:
      "From Barcelona to Buenos Aires, Spanish opens up half the world. Maya speaks Spanish with you daily, adapting to your level, your location, and the conversations you actually need to have.",
    faqs: [
      {
        q: "How long does it take to learn Spanish?",
        a: "Spanish is one of the easier languages for English speakers. Most learners reach conversational B1 level in 2–4 months of consistent daily practice. With Lisana's daily Maya sessions and pronunciation scoring, progress is measurable and consistent.",
      },
      {
        q: "Can I learn Spanish for free with Lisana?",
        a: "Yes. The free plan gives you 3 AI conversation sessions per day, daily pronunciation exercises, and vocabulary practice. No credit card needed. Upgrade to Pro for unlimited sessions and Maya's long-term learning memory.",
      },
      {
        q: "Is Lisana good for learning Latin American Spanish vs. Spain Spanish?",
        a: "Yes. Maya can adapt to both European Spanish (Spain) and Latin American Spanish depending on your location and goals. During onboarding you specify your target region and Maya adjusts her vocabulary, expressions, and pronunciation guidance accordingly.",
      },
      {
        q: "Can I prepare for the DELE exam with Lisana?",
        a: "Yes. Lisana is great preparation for DELE and SIELE. Maya can run speaking practice sessions that mirror the exam format, give structured feedback on fluency and accuracy, and target your weak areas. Many learners combine Lisana with formal test prep materials.",
      },
      {
        q: "Is Lisana better than Babbel for Spanish?",
        a: "Babbel is strong for structured vocabulary and grammar lessons. Lisana is built for speaking fluency: you practice real, open-ended conversations with an AI coach who remembers your history and adapts. If fluency in spoken Spanish is your goal, Lisana provides more targeted practice.",
      },
    ],
    testimonials: [
      {
        quote:
          "I relocated to Madrid with near-zero Spanish. Within two months of daily Maya sessions I was handling my own apartment contract negotiations. Nothing else gave me practical speaking confidence this fast.",
        name: "Tom H.",
        role: "British expat living in Madrid",
      },
      {
        quote:
          "I'm preparing for the DELE B2 exam. Maya runs speaking practice in the exact DELE format and gives me detailed feedback every time. My fluency has improved dramatically.",
        name: "Anna M.",
        role: "DELE B2 candidate in Buenos Aires",
      },
      {
        quote:
          "As a remote worker in Barcelona, I needed Spanish fast. Six weeks in I'm having real conversations with my neighbors and local colleagues. Maya remembers everything we worked on.",
        name: "Léa D.",
        role: "French digital nomad in Barcelona",
      },
    ],
  },

  french: {
    name: "French",
    flag: "🇫🇷",
    speakers: "300 million+",
    regions: "France, Belgium, Canada, Africa",
    cta: "Start speaking French today",
    why: [
      "Official language in 29 countries across Europe, Africa, and the Americas",
      "Required for daily life and integration in France, Belgium, and Switzerland",
      "High demand in international organizations including the UN, EU, and UNESCO, as well as diplomatic careers",
    ],
    metaTitle: "Learn French Online with AI | Lisana",
    metaDescription:
      "Learn French online with Maya, your AI language coach. Practice real conversations for expat life in France, Belgium, or Switzerland. CEFR-aligned, all levels, daily speaking practice.",
    heroSubtitle:
      "French is the language of diplomacy, culture, and integration across 29 countries. Whether you're moving to Paris, starting in Brussels, or preparing for DELF, Maya is your daily French practice partner.",
    faqs: [
      {
        q: "How long does it take to learn French?",
        a: "French is moderately challenging for English speakers. Most learners reach B1 in 4–6 months of consistent daily practice. Lisana's conversation-first approach helps you build spoken fluency faster than grammar-focused methods.",
      },
      {
        q: "Can I prepare for the DELF or DALF with Lisana?",
        a: "Yes. Maya can run DELF-style speaking practice sessions covering structured monologues, dialogues, and debates, with feedback aligned with DELF rubrics. Many learners use Lisana alongside official DELF prep books for comprehensive preparation.",
      },
      {
        q: "Can I learn French specifically for living in Paris?",
        a: "Absolutely. Maya includes location-aware scenarios covering daily life in Paris, Brussels, Lyon, and Montreal. You can practice conversations for French bureaucracy, healthcare, job interviews, and social situations specific to where you're living or moving.",
      },
      {
        q: "Is Lisana good for learning Canadian French vs. European French?",
        a: "Yes. You can specify your target variety during onboarding. Maya adapts to Québécois French or European French depending on your goals and location.",
      },
      {
        q: "How is Lisana different from Pimsleur for French?",
        a: "Pimsleur is excellent for building foundational audio patterns through repetition. Lisana is built for open-ended conversation: you speak freely, Maya responds in real time, corrects you naturally, and builds a profile of your strengths and gaps. The two approaches complement each other well.",
      },
    ],
    testimonials: [
      {
        quote:
          "I moved to Paris for work and French bureaucracy was overwhelming. Maya helped me practice exactly the conversations I needed, including dealing with the préfecture, opening a bank account, and talking to my landlord.",
        name: "Yuki T.",
        role: "Japanese expat in Paris",
      },
      {
        quote:
          "I was preparing for my DELF B2 exam and needed speaking practice above all else. Maya simulates the exam format perfectly and her feedback is more useful than any tutor I had before.",
        name: "Carlos V.",
        role: "DELF B2 candidate, Mexico City",
      },
      {
        quote:
          "Working at an EU institution in Brussels requires conversational French. Three months of daily sessions with Maya and I'm now comfortable in French-language meetings.",
        name: "Elena B.",
        role: "EU institution employee in Brussels",
      },
    ],
  },

  italian: {
    name: "Italian",
    flag: "🇮🇹",
    speakers: "65 million+",
    regions: "Italy, Switzerland",
    cta: "Start speaking Italian today",
    why: [
      "Essential for living and working in Italy, one of Europe's most popular expat destinations",
      "The language of art, fashion, food, and business across the Mediterranean",
      "Widely spoken in parts of Switzerland and increasingly valued in EU institutions",
    ],
    metaTitle: "Learn Italian Online with AI | Lisana",
    metaDescription:
      "Learn Italian online with Maya, your AI language coach. Practice real conversations for expat life in Italy across Rome, Milan, and Florence. CEFR-tracked progress, all levels from A1.",
    heroSubtitle:
      "Italian is one of the world's most beloved languages and one of the most practical for anyone living or working in Italy. Maya speaks Italian with you every day, from first words to full fluency.",
    faqs: [
      {
        q: "How long does it take to learn Italian?",
        a: "Italian is generally considered one of the easiest languages for English speakers due to its regular grammar and Latin roots. Most learners reach conversational B1 in 3–5 months with daily 20-minute practice sessions. Lisana's speaking-first approach accelerates practical fluency.",
      },
      {
        q: "Can I learn Italian for free with Lisana?",
        a: "Yes. The free plan includes 3 daily conversation sessions with Maya, daily pronunciation exercises, and vocabulary practice. No credit card is required to get started.",
      },
      {
        q: "Can I prepare for the CILS or CELI Italian exam with Lisana?",
        a: "Yes. Maya can practice the speaking sections of CILS (Certificazione di Italiano come Lingua Straniera) and CELI in formats aligned with those exams. She gives structured feedback on fluency, vocabulary range, and grammar accuracy.",
      },
      {
        q: "Is Lisana useful for learning Italian for work in Italy?",
        a: "Absolutely. Maya includes work-specific scenarios covering job interviews, office communication, negotiation, and email writing. For expats working in Italian companies, Lisana's professional vocabulary focus is far more practical than general-purpose language apps.",
      },
      {
        q: "Can I practice regional Italian dialects?",
        a: "Lisana focuses on standard Italian (italiano standard) which is understood everywhere in Italy. For regional accents and dialects, we recommend supplementing Lisana with local media. Maya's pronunciation assessment is calibrated to standard Italian.",
      },
    ],
    testimonials: [
      {
        quote:
          "I accepted a job in Milan speaking almost no Italian. Four months of Maya sessions and I'm now running meetings in Italian. The professional vocabulary scenarios are exactly what I needed.",
        name: "Sophie R.",
        role: "French expat working in Milan",
      },
      {
        quote:
          "Italy was always my dream destination. Maya made learning Italian genuinely enjoyable. The daily news feature kept me learning real vocabulary, not just textbook phrases.",
        name: "David K.",
        role: "American expat in Florence",
      },
      {
        quote:
          "Preparing for CILS B2 was stressful. Maya's speaking practice sessions gave me the repetitions I needed and her feedback was always specific and actionable.",
        name: "Mei L.",
        role: "CILS B2 candidate in Rome",
      },
    ],
  },

  english: {
    name: "English",
    flag: "🇬🇧",
    speakers: "1.5 billion+",
    regions: "Worldwide",
    cta: "Start speaking English today",
    why: [
      "The global language of business, science, and international communication",
      "Required for IELTS, TOEFL, and professional accreditation in most fields",
      "Essential for expats and students relocating to English-speaking countries",
    ],
    metaTitle: "Learn English Online with AI | Lisana",
    metaDescription:
      "Learn English online with Maya, your AI language coach. Practice real conversations, prepare for IELTS or TOEFL, and build fluency for work and daily life. All levels A1–C1.",
    heroSubtitle:
      "English is the language of global opportunity. Whether you're preparing for IELTS, relocating to London or Toronto, or advancing your career, Maya is your daily English practice partner, available 24/7.",
    faqs: [
      {
        q: "Can I prepare for IELTS with Lisana?",
        a: "Yes. Maya simulates the IELTS Speaking test (Parts 1, 2, and 3) and evaluates your responses against IELTS criteria: fluency, coherence, lexical resource, and grammatical range. Many Lisana users have improved their IELTS band score by 0.5–1.5 bands through daily practice.",
      },
      {
        q: "Is Lisana good for business English?",
        a: "Absolutely. Maya has specific scenario libraries for business communication, including presentations, meetings, negotiations, job interviews, and professional email writing. For professionals who need work-ready English, this targeted practice is far more effective than general learning apps.",
      },
      {
        q: "How is Lisana different from speaking with a human English tutor?",
        a: "A human tutor costs €30–80/hour and is available once or twice a week. Maya is available 24/7, costs a fraction of that, and has perfect patience. She remembers every session, tracks your recurring mistakes, and adapts to your specific goals. For speaking repetitions, quantity matters. Lisana makes it affordable.",
      },
      {
        q: "Can complete beginners learn English with Lisana?",
        a: "Yes. Lisana supports A1 beginners. Maya speaks slowly with simple vocabulary at beginner level, gently introduces new words in context, and scales up as your confidence grows. The onboarding sets your level and Maya calibrates from there.",
      },
      {
        q: "Does Lisana support American English and British English?",
        a: "Yes. You can choose American English or British English during onboarding. Maya adapts her vocabulary, spelling guidance, and pronunciation reference accordingly. This is especially useful for IELTS (British) vs. TOEFL (American) preparation.",
      },
    ],
    testimonials: [
      {
        quote:
          "My IELTS band score went from 6.0 to 7.5 in six weeks. Maya simulates the speaking test perfectly and gives feedback on every single turn. I couldn't have done it without Lisana.",
        name: "Marco L.",
        role: "IELTS candidate, Milan → London",
      },
      {
        quote:
          "I relocated from Brazil to Amsterdam where everything at work is in English. Maya's daily sessions boosted my confidence in meetings enormously. I stopped dreading presentations.",
        name: "Fernanda O.",
        role: "Brazilian expat in Amsterdam",
      },
      {
        quote:
          "Business English was always my weak point. After two months with Maya I started leading client calls in English. The professional scenarios are incredibly realistic.",
        name: "Hyun-jun P.",
        role: "South Korean product manager in London",
      },
    ],
  },
};

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(languageData).map((language) => ({ language }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { language: string };
}): Promise<Metadata> {
  const { language } = params;
  const data = languageData[language];
  if (!data) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisana.app";

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${siteUrl}/learn/${language}`,
      type: "website",
      siteName: "Lisana",
      images: [
        {
          url: `/og-${language}.png`,
          width: 1200,
          height: 630,
          alt: `Learn ${data.name} Online with AI by Lisana`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.metaTitle,
      description: data.metaDescription,
      images: [`/og-${language}.png`],
    },
    alternates: {
      canonical: `${siteUrl}/learn/${language}`,
    },
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function LearnLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const { language } = params;
  const data = languageData[language];

  if (!data) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD FAQ structured data */}
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
                href="/landing"
                className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2"
              >
                Home
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
            <span className="text-lg">{data.flag}</span>
            {data.speakers} speakers · {data.regions}
          </div>
          <h1 className="font-lexend font-bold text-4xl md:text-5xl text-on-surface leading-tight mb-6">
            Learn {data.name} Online<br />With a Tutor Who Actually Knows You.
          </h1>
          <p className="font-manrope text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-10">
            {data.heroSubtitle}
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
            No credit card · No download · Start in 60 seconds
          </p>
        </section>

        {/* WHY THIS LANGUAGE */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-lexend font-bold text-3xl text-on-surface text-center mb-10">
              Why {data.name}?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {data.why.map((reason, i) => (
                <div key={i} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm flex gap-4">
                  <div className="w-8 h-8 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined ms-filled text-[16px] text-primary">check_circle</span>
                  </div>
                  <p className="font-manrope text-sm text-on-surface leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW LISANA WORKS */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
              How Lisana works.
            </h2>
            <p className="font-manrope text-base text-on-surface-variant mt-3 max-w-xl mx-auto">
              Three steps to go from zero to real {data.name} conversations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "💬",
                title: "Talk to Maya. Right Now.",
                body: `Open Lisana and start a real ${data.name} conversation immediately. No account, no credit card. Maya introduces herself and meets you where you are.`,
              },
              {
                step: "2",
                icon: "👤",
                title: "Tell Maya your goals.",
                body: `A quick 5-question setup covering your current ${data.name} level, goals (work, visa, travel, exam), and interests. Maya personalises every conversation from day one.`,
              },
              {
                step: "3",
                icon: "🔥",
                title: "Practice daily. See results.",
                body: `20 minutes a day with Maya, daily pronunciation drills, and vocabulary quizzes. Maya tracks your progress, identifies gaps, and adapts. This is how fluency happens.`,
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-surface-lowest rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-ambient-sm text-2xl">
                  {s.icon}
                </div>
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-lexend font-bold text-xs text-white">{s.step}</span>
                </div>
                <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{s.title}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
                Everything you need to speak {data.name}.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "auto_awesome",
                  iconBg: "bg-primary-container",
                  iconColor: "text-primary",
                  title: `Speaking practice with Maya`,
                  body: `Maya holds real ${data.name} conversations with you, corrects your mistakes naturally, and remembers everything you've worked on. Available 24/7, infinitely patient.`,
                },
                {
                  icon: "newspaper",
                  iconBg: "bg-tertiary-container",
                  iconColor: "text-tertiary",
                  title: `Daily ${data.name} news`,
                  body: `Read and listen to real ${data.name} news articles adapted to your CEFR level. Learn vocabulary in context rather than from a wordlist, the way native speakers actually acquire language.`,
                },
                {
                  icon: "school",
                  iconBg: "bg-secondary-container",
                  iconColor: "text-secondary",
                  title: "Vocabulary & grammar",
                  body: `Spaced-repetition vocabulary practice, grammar explanations in plain language, and a personalised study plan generated from your actual sessions with Maya.`,
                },
              ].map((f) => (
                <div key={f.title} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                  <div className={`w-10 h-10 ${f.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                    <span className={`material-symbols-outlined ms-filled text-[20px] ${f.iconColor}`}>{f.icon}</span>
                  </div>
                  <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{f.title}</h3>
                  <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl text-on-surface">
              Real people. Real {data.name}.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {data.testimonials.map((t) => (
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
        </section>

        {/* FAQ */}
        <section className="bg-[#F7F7F8] border-y border-outline-variant/20 py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-lexend font-bold text-3xl text-on-surface">
                Questions about learning {data.name} with Lisana.
              </h2>
            </div>
            <div className="space-y-4">
              {data.faqs.map((faq) => (
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
            <div className="text-4xl mb-4">{data.flag}</div>
            <h2 className="font-lexend font-bold text-4xl md:text-5xl text-white mb-4">
              {data.cta}.
            </h2>
            <p className="font-manrope text-base text-white/80 mb-10">
              One conversation with Maya. No credit card. No account needed. See the difference in two minutes.
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
              No credit card required · Available on any device · Cancel anytime
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
            <div className="flex flex-wrap gap-3 justify-center">
              {["german", "spanish", "french", "italian", "english"].map((lang) => (
                <Link
                  key={lang}
                  href={`/learn/${lang}`}
                  className={`font-manrope text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                    lang === language
                      ? "bg-primary text-white"
                      : "text-on-surface-variant bg-surface-high hover:text-on-surface"
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </Link>
              ))}
            </div>
            <p className="font-manrope text-xs text-on-surface-variant">© 2026 Lisana · Vienna, Austria</p>
          </div>
        </footer>

      </div>
    </>
  );
}
