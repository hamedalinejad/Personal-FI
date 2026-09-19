/**
 * Phase 10/11 — browser shell entry (static).
 * Navigation only; financial mutations go through host bridge when wired.
 * Does not import Core SQL or feature internals.
 */
import { TOP_LEVEL_ROUTES, resolveShellPath } from "../../../src/web/routes.js";
import { SURFACES } from "../../../src/web/surfaces.js";
import { createInitialShellState, completeOnboarding } from "../../../src/web/shellState.js";

const view = document.getElementById("view");
const sheet = document.getElementById("sheet");
let state = createInitialShellState();

const PAGE_COPY = {
  "/": "Dashboard — net worth, cash, alerts",
  "/money": "Accounts & cash (journal truth)",
  "/transactions": "Income, expense, transfer, cheque",
  "/investments": "Crypto · Stocks · Funds · Metals (tabs/sheets)",
  "/loans": "Loans, schedule, payments",
  "/more": "Reports · Planning · Settings · Backup · Import",
};

function render() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const { route, sheet: sheetPath, unknown } = resolveShellPath(hash);
  document.querySelectorAll(".tabbar a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === route);
  });
  if (state.phase === "onboarding") {
    view.innerHTML = `
      <h1>Onboarding</h1>
      <p>Create book · set base currency · then continue offline.</p>
      <label>Book name <input id="bookName" value="Personal Book" /></label>
      <label>Base currency <input id="baseCcy" value="IRR" /></label>
      <button type="button" id="btnOnboard">Create book</button>
    `;
    document.getElementById("btnOnboard")?.addEventListener("click", () => {
      state = completeOnboarding(state, {
        bookId: crypto.randomUUID(),
        baseCurrency: document.getElementById("baseCcy").value || "IRR",
        bookName: document.getElementById("bookName").value,
      });
      location.hash = "#/money";
      render();
    });
    return;
  }
  view.innerHTML = `
    <h1>${route}</h1>
    <p>${PAGE_COPY[route] || ""}</p>
    <p>Book: <code>${state.book?.name || "—"}</code> · Base: <code>${state.baseCurrency || "—"}</code></p>
    ${unknown ? "<p role='alert'>Unknown path — redirected conceptually to home.</p>" : ""}
    <ul>
      <li>Surfaces: ${Object.keys(SURFACES).join(", ")}</li>
      <li>Top-level routes locked: ${TOP_LEVEL_ROUTES.join(" ")}</li>
    </ul>
  `;
  if (sheetPath) {
    sheet.hidden = false;
    sheet.innerHTML = `<h2>Sheet</h2><p>${sheetPath}</p><button type="button" id="closeSheet">Close</button>`;
    document.getElementById("closeSheet")?.addEventListener("click", () => {
      sheet.hidden = true;
      location.hash = `#${route}`;
    });
  } else {
    sheet.hidden = true;
  }
}

window.addEventListener("hashchange", render);
render();
