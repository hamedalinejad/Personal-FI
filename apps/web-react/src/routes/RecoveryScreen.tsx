import React from "react";
import { useAppState, useAppDispatch } from "../app/AppProviders";
import { Button } from "../components/common/Button";

export function RecoveryScreen() {
  const { lastError } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>بازیابی</h1>
      <p className="muted">خطایی در باز کردن دفتر رخ داد.</p>
      {lastError ? (
        <p>
          <code>{lastError.code}</code>: {lastError.message}
        </p>
      ) : null}
      <Button type="button" onClick={() => dispatch({ type: "CLEAR_RECOVERY" })}>
        تلاش مجدد
      </Button>
    </section>
  );
}
