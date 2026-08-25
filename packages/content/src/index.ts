import type { ContentBundle, PrayerDefinition } from "@zekraneh/domain";
import contentBankJson from "../data/content-bank.json";
import nightPrayerJson from "../data/night-prayer.json";
import ziyaratAshuraJson from "../data/ziyarat-ashura.json";

export const contentBundle: ContentBundle = {
  ...(contentBankJson as Omit<ContentBundle, "prayers">),
  prayers: [nightPrayerJson as PrayerDefinition, ziyaratAshuraJson as PrayerDefinition],
};

export const nightPrayer = contentBundle.prayers[0] as PrayerDefinition;
export const ziyaratAshura = contentBundle.prayers[1] as PrayerDefinition;
export const worships = contentBundle.prayers;
export const worshipsById = new Map(worships.map((worship) => [worship.id, worship]));

export const contentItemsById = new Map(contentBundle.items.map((item) => [item.id, item]));
export const contentSourcesById = new Map(contentBundle.sources.map((source) => [source.id, source]));
