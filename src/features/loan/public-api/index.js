/**
 * Loan feature public API — only surface other packages may import.
 * @see docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md
 */
export { createLoan } from "../commands/createLoan.js";
export { recordPayment } from "../commands/recordPayment.js";
export { capabilities } from "../commands/capabilities.js";
