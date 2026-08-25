import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const brand = path.join(root, "assets", "brand");
const images = path.join(root, "assets", "images");
const icons = path.join(root, "public", "icons");
await mkdir(images, { recursive: true });
await mkdir(icons, { recursive: true });

const logo = path.join(brand, "zekraneh-logo.svg");
const mark = path.join(brand, "zekraneh-mark.svg");
const mono = path.join(brand, "zekraneh-monochrome.svg");

await Promise.all([
  sharp(logo).resize(1024, 1024).png().toFile(path.join(images, "icon.png")),
  sharp(mark).resize(432, 432, { fit: "contain" }).png().toFile(path.join(images, "android-icon-foreground.png")),
  sharp(mono).resize(432, 432, { fit: "contain" }).png().toFile(path.join(images, "android-icon-monochrome.png")),
  sharp(mark).resize(512, 512, { fit: "contain" }).png().toFile(path.join(images, "splash-icon.png")),
  sharp(logo).resize(64, 64).png().toFile(path.join(images, "favicon.png")),
  sharp(logo).resize(192, 192).png().toFile(path.join(icons, "icon-192.png")),
  sharp(logo).resize(512, 512).png().toFile(path.join(icons, "icon-512.png")),
]);

console.log("آیکن‌های ذکرانه تولید شدند.");
