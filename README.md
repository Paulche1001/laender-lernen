# 🌍 Länder lernen

**Länder lernen** ist eine mit **React Native, Expo und TypeScript** entwickelte Karteikarten-App zum Lernen von Ländern, Hauptstädten, Flaggen und Sprachen. Ein intelligentes Wiederholungssystem plant Lernkarten abhängig davon, wie sicher die Antwort bereits sitzt.

Das Projekt ist eine eigenständig entwickelte Lernanwendung und dient auch als Beispiel für meine praktische Arbeit mit mobilen Benutzeroberflächen, zustandsbasierter Logik und Firebase.

## ✨ Funktionen

- **Interaktive Karteikarten** zu Ländern, Hauptstädten, Flaggen und Sprachen
- **Selbsteinschätzung nach jeder Karte** mit „Again“, „Hard“, „Good“ und „Easy“
- **Spaced Repetition mit FSRS** (`ts-fsrs`): individuelle Wiederholungstermine statt fester Intervalle
- **Tägliches Lernlimit** für neue Karten, in den Einstellungen anpassbar
- **Lernübersicht** mit fälligen Wiederholungen, neuen und noch ungelernten Karten
- **Benutzerregistrierung und Anmeldung** über Firebase Authentication
- **Speicherung des Lernfortschritts** und der Einstellungen mit Cloud Firestore
- **Design-Einstellungen** und Möglichkeit, den eigenen Lernfortschritt zurückzusetzen

## 🛠️ Technologien

| Bereich | Technologie |
| --- | --- |
| App & Benutzeroberfläche | React Native, Expo, Expo Router |
| Programmiersprache | TypeScript |
| Authentifizierung | Firebase Authentication |
| Datenhaltung | Cloud Firestore |
| Wiederholungsalgorithmus | FSRS (`ts-fsrs`) |
| Weitere Bausteine | React Hooks, React Context |

## 🧠 So funktioniert das Lernen

1. Die App stellt fällige Wiederholungen und eine begrenzte Zahl neuer Länder zu einer Lerneinheit zusammen.
2. Eine Karte zeigt zunächst die Frage; die Lösung kann aufgedeckt werden.
3. Die lernende Person bewertet, wie gut sie die Antwort wusste.
4. Der **FSRS-Algorithmus** berechnet anhand der Bewertung und des bisherigen Kartenstatus den nächsten Wiederholungszeitpunkt.
5. Fortschritt und Bewertungen werden für das angemeldete Benutzerkonto gespeichert.

## 🚀 Lokal starten

**Voraussetzungen:** Node.js, npm und eine passende Expo-Entwicklungsumgebung.

```bash
git clone https://github.com/Paulche1001/laender-lernen.git
cd laender-lernen
npm install
npx expo start
```

Anschließend die App mit einer unterstützten Expo-Umgebung oder im Web öffnen. Für die Anmeldung und die Speicherung des Lernfortschritts wird ein entsprechend konfiguriertes Firebase-Projekt benötigt.

> **Hinweis:** Im Repository ist eine Firebase-Projektkonfiguration enthalten. Für den Einsatz mit einem eigenen Projekt müssen Firebase Authentication und Cloud Firestore eingerichtet und ihre Sicherheitsregeln passend konfiguriert werden.

## 📁 Projektstruktur

```text
app/              # Screens und Navigation (Expo Router)
components/       # Wiederverwendbare UI-Komponenten
context/          # Authentifizierungsstatus
data/             # Länderdaten
firebase/         # Firebase-Initialisierung
learning/         # FSRS-Konfiguration und Bewertungen
services/         # Datenzugriff und Fortschrittsverwaltung
theme/            # Design und Theme-Verwaltung
```

## 🎯 Was ich mit dem Projekt umgesetzt habe

- Entwicklung einer plattformübergreifenden App mit **React Native und TypeScript**
- Aufteilung von Benutzeroberfläche, Lernlogik und Datenzugriff in separate Komponenten und Module
- Integration von **Firebase Auth** und **Firestore**
- Umsetzung eines personalisierten Wiederholungssystems auf Basis eines bestehenden Scheduling-Algorithmus

## 👤 Entwickler

**Paul Koob** · B.Sc. Angewandte Informatik, Schwerpunkt Software Engineering & Development

[GitHub-Profil](https://github.com/Paulche1001)

---

*Privates Lern- und Portfolio-Projekt.*
