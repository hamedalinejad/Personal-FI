import test from "node:test";
import assert from "node:assert/strict";

const FA = {
  LICENSE_REQUIRED: "این قابلیت در نسخه فعلی فعال نیست.",
  HOST_BRIDGE_UNWIRED: "اتصال ذخیره‌سازی هنوز برقرار نشده است.",
};

function userMessageForError(code, fallbackMessage) {
  if (!code) return "عملیات انجام نشد. جزئیات را بررسی کنید.";
  const key = code.split(":")[0];
  if (FA[key]) return FA[key];
  if (fallbackMessage && !/SQLITE|SQL\s|no such/i.test(fallbackMessage)) return fallbackMessage;
  return "عملیات انجام نشد. جزئیات را بررسی کنید.";
}

test("never expose SQLITE to user", () => {
  assert.equal(
    userMessageForError("SQLITE_ERROR", "SQLITE constraint failed"),
    "عملیات انجام نشد. جزئیات را بررسی کنید.",
  );
});

test("license localized", () => {
  assert.match(userMessageForError("LICENSE_REQUIRED"), /فعال نیست/);
});
