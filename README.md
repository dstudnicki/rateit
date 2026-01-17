# RateIT - Professional Social Platform

> Platforma społecznościowa typu LinkedIn z zaawansowanym systemem dopasowywania treści opartym na AI.

## 📚 Dokumentacja

**Pełna dokumentacja dostępna w folderze [`/docs`](./docs/)**

### Szybki dostęp:

- 📖 [**Przewodnik po Dokumentacji**](./docs/README.md) - Start tutaj!
- 🎯 [01. Wprowadzenie](./docs/01-INTRODUCTION.md) - Cel aplikacji, funkcjonalności, technologie
- 🏗️ [02. Architektura Systemu](./docs/02-ARCHITECTURE.md) - Struktura projektu, wzorce, przepływ danych
- 💾 [03. Baza Danych](./docs/03-DATABASE.md) - Diagram ER, modele, relacje
- 🧠 [System Dopasowywania Treści](./ONBOARDING_CONTENT_MATCHING.md) - AI content matching
- ⚙️ [Dokumentacja Techniczna](./CONTENT_MATCHING_TECHNICAL.md) - Szczegóły algorytmu

---

## 🚀 Quick Start

### Instalacja

```bash
# Instalacja zależności
pnpm install

# Konfiguracja .env
cp .env.example .env.local
# Edytuj .env.local

# Uruchomienie dev servera
pnpm dev
```

### Wymagania
- Node.js 18+
- MongoDB 6+
- pnpm (zalecane)

---

## 🛠️ Stack Technologiczny

- **Frontend**: Next.js 16+, React 19+, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, MongoDB, Mongoose
- **Auth**: Better Auth (email + Google + GitHub)
- **UI**: shadcn/ui + Radix UI

---

## 📂 Struktura Projektu

```
rateit/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions (biznes logika)
│   ├── admin/             # Panel admina
│   ├── companies/         # Strony firm
│   └── ...
├── components/            # Komponenty React
├── lib/                   # Biblioteki pomocnicze
├── models/                # Mongoose modele
├── docs/                  # 📚 Dokumentacja
└── public/                # Pliki statyczne
```

---

## 🎯 Kluczowe Funkcjonalności

- ✅ **Posty** - Tworzenie, komentowanie, lajkowanie
- ✅ **Firmy** - Katalog firm z systemem recenzji
- ✅ **Profile** - Doświadczenie, edukacja, umiejętności
- ✅ **AI Matching** - Inteligentne dopasowywanie treści
- ✅ **Search** - Zaawansowana wyszukiwarka
- ✅ **Moderacja** - Panel admina z systemem banów

---

## 📖 Dalsze Czytanie

Przejdź do [`/docs`](./docs/) aby poznać szczegóły implementacji, architekturę i best practices.

---

**Version**: 0.1.0  
**Last Updated**: 2026-01-13

