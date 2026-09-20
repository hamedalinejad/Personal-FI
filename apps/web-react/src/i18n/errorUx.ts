/** User-facing error copy — never show raw SQLite text */

const FA: Record<string, string> = {
  LICENSE_REQUIRED: "این قابلیت در نسخه فعلی فعال نیست.",
  VALUATION_FX_MISSING: "نرخ تبدیل برای تاریخ گزارش موجود نیست.",
  VALUATION_PRICE_AFTER_ASOF: "قیمت انتخاب‌شده بعد از تاریخ گزارش است.",
  HOST_BRIDGE_UNWIRED: "اتصال ذخیره‌سازی هنوز برقرار نشده است.",
  ACCOUNT_NOT_FOUND: "حساب پیدا نشد.",
  ACCOUNT_ARCHIVE_NONZERO_BALANCE: "بستن حساب فقط با مانده صفر از دفتر کل ممکن است.",
  ACCOUNT_CURRENCY_MISMATCH: "ارز حساب با مبلغ تراکنش یکی نیست.",
  VALIDATION_ERROR: "ورودی نامعتبر است. فیلدها را بررسی کنید.",
  OP_COMMAND_HASH_MISMATCH: "این شناسه عملیات قبلاً با دادهٔ دیگری استفاده شده است.",
  WRITER_REQUIRED: "دستگاه/تب دیگری در حال نوشتن است. کمی بعد دوباره تلاش کنید.",
  DATA_DIR_REQUIRED: "مسیر داده تنظیم نشده است.",
  COMMAND_NOT_WIRED: "این فرمان هنوز در میزبان متصل نیست.",
};

export function userMessageForError(code: string | undefined, fallbackMessage?: string): string {
  if (!code) return "عملیات انجام نشد. جزئیات را بررسی کنید.";
  const key = code.split(":")[0];
  if (FA[key]) return FA[key];
  if (key.startsWith("VALIDATION_ERROR")) return FA.VALIDATION_ERROR;
  if (fallbackMessage && !/SQLITE|SQL\s|no such/i.test(fallbackMessage)) {
    return fallbackMessage;
  }
  return "عملیات انجام نشد. جزئیات را بررسی کنید.";
}
