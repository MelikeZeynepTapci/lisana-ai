# LinguaTutor — Onboarding Akışı
## Teorik Tasarım Dokümanı

---

## Genel Bakış

Kullanıcı kayıt olduktan sonra dashboard'a geçmeden önce bu akıştan geçer.
Toplam süre: ~50 saniye (intro yazılmazsa).
Toplam adım: 7

Toplanan verinin tamamı bir yerde kullanılır — hiçbiri dekoratif değil.

---

## Adım 1 — Dil Seçimi

**Ne gösterilir:**
5 dil seçeneği, bayrak emojisi ve dil adıyla birlikte yan yana kartlar.

```
🇩🇪 Almanca    🇬🇧 İngilizce    🇪🇸 İspanyolca
🇫🇷 Fransızca  🇮🇹 İtalyanca
```

**Veri:**
`language: 'german' | 'english' | 'spanish' | 'french' | 'italian'`

**UX notu:**
Seçer seçmez otomatik olarak bir sonraki adıma geç.
"Devam et" butonu yok — tek tap yeterli.

---

## Adım 2 — Seviye

**Ne gösterilir:**
4 kart, her birinde kısa bir açıklama var.

```
Hiç bilmiyorum      → "Alfabeden başlıyorum"
Biraz biliyorum     → "Birkaç kelime ve basit cümleler"
Orta seviyeyim      → "Günlük konuşmalar yapabiliyorum"
İyiyim ama pasifim  → "Anlıyorum ama konuşmakta zorlanıyorum"
```

**Veri:**
`level: 'A1' | 'A2' | 'B1' | 'B2'`

**UX notu:**
Yine otomatik geçiş.
Bu veri Maya'nın konuşma karmaşıklığını ve kelime seçimini belirler.
Ayrıca pronunciation egzersizleri için cümle setini de belirler.

---

## Adım 3 — Neden Öğreniyorsun

**Ne gösterilir:**
5 seçenek, emoji + kısa açıklama.

```
🏙 Yaşadığım ülke için
💼 İş için
✈️ Seyahat için
🎓 Sınav için   (IELTS, TestDAF, DELE vs.)
❤️ Kişisel ilgi
```

**Veri:**
`reason: 'living_abroad' | 'work' | 'travel' | 'exam' | 'personal'`

**UX notu:**
Otomatik geçiş.
Bu seçim Maya'nın tüm konuşma tonunu belirler:
- `work` → formal, iş vocabularisi ağırlıklı
- `travel` → casual, pratik senaryolar
- `exam` → yapısal, sınav odaklı geri bildirim
- `living_abroad` → günlük hayat senaryoları, bürokratik kelimeler
- `personal` → serbest, kullanıcının ilgi alanlarına odaklı

---

## Adım 4 — Günlük Hedef

**Ne gösterilir:**
4 seçenek, her birinde motivasyonel bir açıklama var.

```
10 dk  → "Günde bir kahve molası kadar"
20 dk  → "En popüler seçim"          ← önerilen badge
30 dk  → "Ciddi ilerleme için"
1 saat → "Yoğun pratik"
```

**Veri:**
`daily_goal_minutes: 10 | 20 | 30 | 60`

**UX notu:**
Otomatik geçiş.
"En popüler seçim" badge'i 20 dakikayı vurgula.
20 dakika gerçekçi bir hedef — hem churn'ü azaltır hem streak'i korur.
Bu değer streak hesaplamasında ve bildirim zamanında kullanılır.

---

## Adım 5 — İlgi Alanları

**Ne gösterilir:**
12 kart, grid layout, çoklu seçim.

```
🎬 Film & Dizi      🎵 Müzik          🍕 Yemek & Mutfak
⚽ Spor             💻 Teknoloji      📚 Kitap & Edebiyat
✈️ Seyahat          🎮 Oyun           🐾 Hayvanlar
💼 İş dünyası       🌿 Doğa           🎨 Sanat
```

**Veri:**
`interests: Interest[]`

**UX notu:**
Minimum 1 seçim zorunlu.
Maksimum sınır yok.
Seçili kartlar highlight olur.
Bu adımda otomatik geçiş yok — birden fazla seçim yapılabildiği için
alt kısımda "Devam et" butonu var. Seçim yapılmadan buton pasif kalır.

Bu veri iki yerde kullanılır:
1. LinguaRooms matching — aynı ilgi alanına sahip kullanıcılar eşleşir
2. Maya'nın konu önerileri — konuşma başlatırken bu alanlardan seçer

---

## Adım 6 — Kendini Tanıt (Opsiyonel)

**Ne gösterilir:**
Maya'nın avatar görseli + kısa bir mesaj + tek serbest metin alanı.

```
┌─────────────────────────────────────────────┐
│  [Maya avatarı]                             │
│                                             │
│  "Seni daha iyi tanımak istiyorum.          │
│   İstersen bir şeyler yaz — mesleğin,       │
│   sevdiğin bir dizi, yaşadığın şehir...     │
│   Tamamen serbest."                         │
│                                             │
│  [Buraya yaz...                           ] │
│                                             │
│  [Kaydet]              [Şimdi değil →]      │
└─────────────────────────────────────────────┘
```

**Veri:**
`intro_sentence: string` (boş bırakılabilir)

**UX notu:**
"Şimdi değil" butonu en az "Kaydet" kadar belirgin olmalı.
Kullanıcıyı zorlamak churn yaratır.
Bu alana yazılan her şey Maya'nın ilk karşılama mesajını
doğrudan şekillendirir — kişisellik buradan gelir.
Kullanıcı "Şimdi değil" derse intro_sentence boş string olarak kaydedilir.

---

## Adım 7 — Maya Karşılama

**Ne gösterilir:**
Önceki adımlarda toplanan veriden GPT-4.1 Mini ile üretilen
kişiselleştirilmiş bir karşılama mesajı.

Mesaj ekrana typewriter efektiyle yazılır.

**Örnek output — (iş + teknoloji + B1 Almanca):**
```
Maya: İş hayatında Almanca kullanmak istiyorsun —
bu çok pratik bir hedef. Teknoloji konularında da
sohbet edeceğiz, bu alanda kelime hazinen hızla
genişleyecek.

Was machst du beruflich?
(Ne iş yapıyorsun?)
```

**Örnek output — (seyahat + yemek + A2 İspanyolca):**
```
Maya: Seyahat için İspanyolca öğrenmek harika
bir motivasyon. Yemek kültürünü de seviyorsun —
İspanya'da ya da Latin Amerika'da restoranda
sipariş vermek artık çok daha keyifli olacak.

¿Adónde quieres viajar primero?
(İlk olarak nereye gitmek istiyorsun?)
```

**Alt kısımda:**
```
[Maya ile konuşmaya başla →]
```

**UX notu:**
Bu butona basılınca iki şey olur:
1. Tüm onboarding verisi Supabase'e kaydedilir
2. Kullanıcı dashboard'a yönlendirilir

Kaydetme işlemi butona basılmadan yapılmaz —
kullanıcı adım 7'ye gelip Maya'nın mesajını okumadan
çıkarsa veri kaydedilmez, bir sonraki girişte onboarding tekrar başlar.

---

## İlerleme Çubuğu (Progress Bar)

Ekranın üst kısmında ince bir çizgi.
Adım ilerledikçe soldan sağa doluyor.
Yüzde yazısı yok — sadece görsel doluluk.
Adım 1'de çok az dolu, adım 7'de tamamen dolu.

---

## Navigasyon Kuralları

```
Adım 1:     Geri yok (ilk adım)
Adım 2–6:   Sol üstte küçük geri oku var
Adım 7:     Geri yok (Maya mesajı üretildi, geri dönmek anlamsız)

Adım 1–4:   Seçim = otomatik ileri git
Adım 5:     Seçim yap + Devam et butonu
Adım 6:     Kaydet veya Şimdi değil
Adım 7:     Maya ile konuşmaya başla
```

---

## Animasyon Kuralları

Her adım soldan sağa kayarak gelir.
Geri gidince sağdan sola kayar.
Adım 7'deki Maya mesajı typewriter efektiyle yazılır.
Geçişler hızlı olmalı (200–250ms) — yavaş animasyon sabırsızlaştırır.

---

## Hata Durumları

Hiçbir adımda kırmızı hata mesajı gösterilmez.
Kullanıcı seçim yapmadan devam edemez ama uyarı da görmez —
"Devam et" butonu sadece pasif (disabled) kalır.
İstisna: Adım 7'de API hatası olursa fallback bir mesaj gösterilir,
kullanıcıya hata bildirilmez.

---

## Supabase Veri Yapısı

### user_profiles.onboarding_data (JSONB)
```json
{
  "language": "german",
  "level": "B1",
  "reason": "work",
  "daily_goal_minutes": 20,
  "interests": ["technology", "film_tv", "travel"],
  "intro_sentence": "Almanya'da yazılım mühendisi olarak çalışıyorum",
  "completed_at": "2026-04-06T10:00:00Z"
}
```

### user_language_profiles (ayrı satır)
```
language:           'german'
cefr_level:         'B1'
daily_goal_minutes: 20
```

---

## Maya Welcome Message — Prompt Mantığı

GPT-4.1 Mini'ye gönderilen bağlam:
- Öğrenilen dil
- Seviye
- Neden öğrendiği
- İlgi alanları (ilk 3 tanesi)
- intro_sentence (varsa)

Kurallar:
- 2–3 cümle, max 60 kelime
- Sıcak ve kişisel — gerçek veriyi referans al
- Son cümle hedef dilde bir soru olsun (parantez içinde çevirisiyle)
- "Yapay zeka" veya "yardımcı olmak için buradayım" gibi ifadeler yasak
- İnsan gibi konuş

---

## Toplanan Verinin Kullanım Haritası

```
language          → Maya konuşma dili, pronunciation cümle seti
level             → Maya zorluk seviyesi, vocabulary seçimi,
                    pronunciation egzersiz seti
reason            → Maya konuşma tonu, senaryo kategorisi
daily_goal        → Streak hedefi, bildirim zamanı, XP günlük cap
interests         → LinguaRooms matching, Maya konu önerileri,
                    daily news kategorisi
intro_sentence    → Maya'nın ilk mesajının kişiselliği
```

---

## Sonraki Adımlar — Progressive Profiling

Onboarding bittikten sonra Maya zamanla daha fazla veri toplar.
Bunlar sistem tarafından user_profiles'a eklenir, kullanıcı fark etmez.

İlk hafta içinde Maya conversation'da sorar:
- "Favori dizi veya filmin var mı?"
- "Hangi şehirde yaşıyorsun?"
- "İş yerinde en çok hangi durumlarda bu dili kullanman gerekiyor?"

Kullanıcı profil sayfasından da ek bilgi ekleyebilir (opsiyonel):
- Meslek
- Şehir
- Sınav tarihi (exam seçtiyse)
- Öğrenmek istediği spesifik konular
