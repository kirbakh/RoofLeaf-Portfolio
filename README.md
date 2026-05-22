# Root & Leaf

Статичний мультисторінковий сайт-вітрина **домашніх рослин і догляду** для портфоліо. **Premium dark** UI: glassmorphism, неонові акценти, анімації, без бекенду.

## Що всередині

- **6 сторінок:** `index.html`, `catalog.html`, `plant.html`, `journal.html`, `about.html`, `contact.html`
- **Дані:** `data/plants.json` (12 рослин), `data/articles.json` (6 статей), `data/reviews.json` (8 відгуків)
- **Локалізація:** `locales/ua.json` + `locales/en.json`, перемикач UA/EN
- **JS:** ES modules — каталог (фільтри, пошук, сортування), картка рослини (`?id=`), обране + **кошик** (`localStorage`), mock checkout на `checkout.html`

## Сучасні ефекти (`css/features.css` + `js/effects.js`)

- **Intro-лоадер** — «квітка з горщика» один раз за сесію (`sessionStorage`)
- **Перехід між сторінками** — крутиться квітка в оверлеї
- **Контент** — той самий спінер у сітках каталогу, журналу, головної, картки товару
- **3D tilt** — картки каталогу, USP, журнал, мозаїка (desktop)
- **Spotlight** — підсвітка hero-фото за курсором
- **Ripple + shine** — кнопки
- **Prefetch** — швидший перехід при наведенні на посилання
- **Back to top** — кнопка після скролу
- **FAQ accordion** — плавне розкриття
- **Scroll-driven titles** — заголовки секцій (підтримка браузера)
- **Градієнтний анімований акцент** у hero

## Локальні фото

```bash
node scripts/download-images.mjs
```

Фото зберігаються в `assets/images/plants/` (12 рослин), `assets/images/articles/`, `assets/images/site/`. Джерело: Pexels (вільна ліцензія).

## Мобільна версія та оптимізація

- `css/responsive.css` — адаптація сіток, header, hero, каталогу, кошика, safe-area
- На телефоні: менше фонових листьів, без parallax і custom cursor, згортані фільтри в каталозі (`<details>`)
- Unsplash-зображення зменшуються через `getPlantImageUrl()` (`thumb` / `card` / `detail`)

## Запуск локально

Потрібен HTTP-сервер (через `fetch` JSON не працює з `file://`):

```bash
cd "Second-prog-portfolio"
npx serve .
```

Відкрийте `http://localhost:3000` (порт може відрізнятися).

Приклади URL:

- Каталог: `/catalog.html`
- Рослина: `/plant.html?id=monstera`
- Стаття: `/journal.html#watering-guide`

## Деплой

### Netlify

1. Перетягніть папку на [Netlify Drop](https://app.netlify.com/drop) **або** підключіть репозиторій.
2. Build command: *(порожньо)*
3. Publish directory: `/` (корінь репо)

### GitHub Pages

У Settings → Pages: source = `main`, folder = `/ (root)`.

## Де правити контент

| Що | Файл |
|-----|------|
| Рослини | `data/plants.json` |
| Статті | `data/articles.json` |
| Відгуки | `data/reviews.json` |
| UI-тексти UA/EN | `locales/ua.json`, `locales/en.json` |
| Стилі | `css/main.css`, `css/motion.css`, `css/features.css` |
| Спільна логіка | `js/main.js`, `js/i18n.js`, `js/utils.js` |

## Стек

HTML · CSS · Vanilla JS · Google Fonts (Syne + Plus Jakarta Sans) · `js/effects.js` (loader, cursor, scroll reveal, page transitions, 3D tilt, spotlight, ripple, prefetch)

## Перевірка даних

```bash
node scripts/validate-data.mjs
node scripts/test-theme.mjs
```

## Ліцензія

Демо-проект для портфоліо. Бренд і тексти вигадані.
