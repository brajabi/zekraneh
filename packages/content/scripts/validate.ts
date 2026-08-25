import { contentBundle } from "../src";
import { validateContentBundle } from "@zekraneh/domain";

const issues = validateContentBundle(contentBundle);

if (issues.length) {
  console.error("اعتبارسنجی محتوای ذکرانه ناموفق بود:");
  for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
  process.exit(1);
}

console.log(`محتوا معتبر است: ${contentBundle.prayers.length} عبادت، ${contentBundle.items.length} متن، نسخه ${contentBundle.contentVersion}`);
