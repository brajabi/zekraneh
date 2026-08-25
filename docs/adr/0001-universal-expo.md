# ADR-0001: اپ universal با Expo، HeroUI Native و SQLite

- وضعیت: پذیرفته‌شده برای نسخه اول
- تاریخ: 2026-08-25

## تصمیم

یک اپ Expo SDK 57 در `apps/client` خروجی Android و Web/PWA را می‌سازد. رابط صفحات فقط از کامپوننت‌های لایه داخلی UI استفاده می‌کند و آن لایه HeroUI Native 1.0.8 را مصرف می‌کند. داده‌های runtime با `expo-sqlite` ذخیره می‌شوند؛ مدل و موتور اجرا در `packages/domain` مستقل از Expo هستند.

## پیامدها

- یک مسیر محصول، طراحی و تست برای Android و Web داریم.
- SQLite روی وب هنوز alpha است و به WASM و هدرهای COEP/COOP وابسته است.
- HeroUI Native روی وب ریسک سازگاری دارد؛ بنابراین تست Chromium، آفلاین و resume شرط انتشار PWA است.
- اگر این ریسک‌ها عملی شوند، لایه داخلی UI و قرارداد repository امکان جایگزینی کتابخانه یا storage وب را بدون تغییر صفحات فراهم می‌کنند.
