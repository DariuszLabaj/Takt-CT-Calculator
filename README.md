# Kalkulator TAKT / CT

Prosty, działający całkowicie po stronie przeglądarki kalkulator do planowania produkcji. Aplikacja udostępnia dwa niezależne obliczenia:

1. **TK → TAKT i limit CT** – obliczenie wymaganego tempa produkcji oraz planistycznego limitu CT na podstawie rocznego zapotrzebowania.
2. **CT → zdolność roczna** – obliczenie możliwej produkcji rocznej na podstawie zmierzonego czasu cyklu i parametrów produkcji.

Aplikacja nie wymaga backendu, serwera aplikacyjnego ani bazy danych.

## Funkcjonalności

- automatyczne przeliczanie wyników po zmianie danych,
- zapamiętywanie danych formularza w `localStorage`,
- przywracanie ostatniej konfiguracji po ponownym otwarciu lub odświeżeniu strony,
- udostępnianie aktualnej konfiguracji poprzez dynamiczny link,
- możliwość użycia natywnego mechanizmu `Web Share API`, jeśli przeglądarka go obsługuje,
- kopiowanie linku do schowka w przeglądarkach bez `Web Share API`,
- generowanie kodu QR zawierającego link do aktualnej konfiguracji,
- odtworzenie konfiguracji bezpośrednio z linku,
- responsywny interfejs,
- stylowanie oparte na Material Design,
- działanie lokalnie w przeglądarce,
- możliwość publikacji jako statyczna strona przez GitHub Pages.

## Jak działa zapisywanie danych

Dane wejściowe formularza są zapisywane w pamięci lokalnej przeglądarki za pomocą:

```javascript
localStorage
```

Klucz danych:

```text
takt-ct-calculator.form.v1
```

Dane są zapisywane przy każdej zmianie pola formularza.

Przy uruchomieniu aplikacja stosuje następującą kolejność:

1. konfiguracja znajdująca się w linku udostępniania,
2. konfiguracja zapisana wcześniej w `localStorage`,
3. wartości domyślne.

Oznacza to, że zwykłe odświeżenie strony nie przywróci wartości domyślnych, jeśli użytkownik wcześniej wprowadził własne dane.

> `localStorage` jest lokalne dla konkretnej przeglądarki i urządzenia. Wyczyszczenie danych witryny lub użycie innej przeglądarki spowoduje brak lokalnie zapisanej konfiguracji.

## Udostępnianie konfiguracji

Konfiguracja może zostać udostępniona bez użycia serwera.

Po wybraniu **Udostępnij** aplikacja tworzy adres zawierający aktualne dane w części `hash` adresu:

```text
#data=...
```

Przykładowo:

```text
https://example.github.io/takt-ct/#data=eyJkZW1hbmQiOiIxMDAwMCIs...
```

Dane są serializowane i kodowane do formatu Base64 URL-safe.

### Dlaczego dane są w URL?

Dzięki temu:

- nie jest potrzebna baza danych,
- nie jest potrzebny backend,
- link może zostać wysłany innemu użytkownikowi,
- otwarcie linku odtwarza konfigurację kalkulatora,
- GitHub Pages może obsługiwać aplikację jako zwykłą stronę statyczną.

Link zawiera konfigurację formularza, a nie wynik wymagający dodatkowego obliczania po stronie serwera.

## Kod QR

Przycisk **Pokaż QR** generuje kod QR dla aktualnego linku udostępniania.

Kod QR jest generowany po stronie przeglądarki z wykorzystaniem biblioteki `QRCode.js` ładowanej z CDN.

Jeżeli biblioteka nie zostanie załadowana, sama aplikacja i kalkulatory nadal pozostają dostępne, natomiast generowanie QR nie będzie możliwe.

## Obliczenia

### 1. TK → TAKT i limit CT

Efektywny czas produkcji:

```text
efektywny czas [h/rok]
    = dni × zmiany × h/zmianę × OEE
```

Limit CT:

```text
Limit CT [s/szt.]
    = dni × zmiany × h/zmianę × OEE × 3600 / TK
```

Takt nominalny:

```text
Takt nominalny [s/szt.]
    = dni × zmiany × h/zmianę × 3600 / TK
```

### 2. CT → zdolność roczna

Efektywny czas produkcji:

```text
efektywny czas [h/rok]
    = dni × zmiany × h/zmianę × OEE
```

Produkcja roczna:

```text
Produkcja [szt./rok]
    = dni × zmiany × h/zmianę × OEE × 3600 / CT
```

Średnia produkcja dzienna:

```text
produkcja roczna / dni
```

Średnia produkcja na zmianę:

```text
produkcja roczna / dni / zmiany
```

Efektywny CT:

```text
efektywny CT [s/szt.]
    = CT / OEE
```

## Struktura projektu

```text
takt-ct/
├── index.html
├── script.js
├── README.md
└── css/
    ├── material.css
    └── styles.css
```

### `index.html`

Główna strona aplikacji. Zawiera formularze, wyniki, przyciski udostępniania oraz dialog z kodem QR.

### `script.js`

Zawiera:

- logikę obliczeń,
- obsługę `localStorage`,
- serializację konfiguracji,
- odczyt konfiguracji z URL,
- generowanie linku udostępniania,
- obsługę Web Share API,
- kopiowanie linku,
- obsługę kodu QR.

### `css/material.css`

Biblioteka stylów Material Design używana przez aplikację.

### `css/styles.css`

Style specyficzne dla kalkulatora oraz elementów udostępniania.

## Uruchomienie lokalne

Aplikacja jest statyczna i może być uruchomiona bez kompilacji.

Można otworzyć:

```text
index.html
```

bezpośrednio w przeglądarce.

Do pracy z funkcjami zależnymi od bezpieczeństwa przeglądarki, np. schowkiem, zalecane jest jednak uruchomienie strony przez lokalny serwer HTTP.

Przykładowo z Pythonem:

```bash
python -m http.server 8000
```

Następnie:

```text
http://localhost:8000/
```

## Publikacja na GitHub Pages

Projekt może być publikowany jako statyczna strona przez GitHub Pages.

### 1. Utworzenie repozytorium

Utwórz repozytorium na GitHubie i umieść w nim pliki projektu.

Przykładowa struktura repozytorium:

```text
repository/
├── index.html
├── script.js
├── README.md
└── css/
    ├── material.css
    └── styles.css
```

### 2. Włączenie GitHub Pages

W ustawieniach repozytorium:

```text
Settings
  → Pages
```

następnie wybierz źródło publikacji, np.:

```text
Deploy from a branch
Branch: main
Folder: / (root)
```

Po zapisaniu GitHub Pages opublikuje zawartość repozytorium.

Adres będzie miał postać:

```text
https://<username>.github.io/<repository>/
```

## Ważne informacje dotyczące linków

Link udostępniania wykorzystuje fragment adresu URL:

```text
#data=...
```

Fragment `hash` nie jest wysyłany do serwera HTTP. Jest odczytywany bezpośrednio przez JavaScript w przeglądarce.

W praktyce oznacza to, że GitHub Pages zawsze może zwrócić ten sam `index.html`, a aplikacja po stronie klienta odczyta konfigurację z adresu.

## Prywatność

Aplikacja nie wysyła danych formularza do własnego serwera ani do bazy danych.

Dane są:

- przechowywane lokalnie przez `localStorage`,
- albo zakodowane w linku udostępniania.

Należy pamiętać, że **zakodowanie danych w URL nie oznacza ich szyfrowania**. Każdy, kto posiada link udostępniania, może odczytać zawartą w nim konfigurację.

Nie należy umieszczać w formularzu danych poufnych.

## Technologie

- HTML5
- CSS3
- JavaScript
- `localStorage`
- Web Share API
- Clipboard API
- HTML `<dialog>`
- [QRCode.js](https://github.com/davidshimjs/qrcodejs)
- GitHub Pages

## Wymagania

Do uruchomienia aplikacji wystarczy współczesna przeglądarka internetowa obsługująca:

- JavaScript,
- `localStorage`,
- `URLSearchParams`,
- `TextEncoder` / `TextDecoder`,
- HTML `<dialog>`.

`Web Share API` jest funkcją opcjonalną. Jeżeli nie jest dostępna, aplikacja korzysta z kopiowania linku do schowka.

## Licencja

Jeżeli projekt ma być publicznie dostępny, uzupełnij tę sekcję zgodnie z wybraną licencją projektu.
