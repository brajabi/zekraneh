# ذکرانه

راهنمای آفلاین و مرحله‌به‌مرحله عبادت‌ها، شامل نماز شب و زیارت عاشورا، برای Android و Web/PWA.

## توسعه با Bun

```sh
bun install
bun run validate:content
bun run test
bun run typecheck
bun run web
```

برای Android و خروجی‌های محلی:

```sh
bun run android
bun run build:android:preview-local
bun run build:android:aab-local
bun run export:web
```

خروجی فروشگاهی امضاشده و استقرار وب از مسیر EAS انجام می‌شود:

```sh
bun run --cwd apps/client build:preview
bun run --cwd apps/client build:production
bun run --cwd apps/client deploy:web
```

متن مذهبی موجود در نسخه اول پیش‌نویس فنی است و پیش از انتشار نیازمند تأیید نهایی صاحب محصول است. منابع پایه: [کیفیت نماز شب](https://www.sistani.org/persian/book/26575/7327/) و [پرسش‌وپاسخ نماز شب](https://www.sistani.org/persian/qa/01067/%3B%D9%BE%D8%B1%D8%B3%D8%B4/).
