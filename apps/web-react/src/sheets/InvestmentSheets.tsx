import React, { useRef, useState } from "react";
import { useGateway, useAppState } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={type === "text" ? "decimal" : undefined}
      />
    </label>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CryptoBuySheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const { book } = useAppState();
  const opRef = useRef(crypto.randomUUID());
  const [instrumentId, setInstrumentId] = useState("");
  const [exchangeId, setExchangeId] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [grossQty, setGrossQty] = useState("");
  const [feeQty, setFeeQty] = useState("0");
  const [price, setPrice] = useState("");
  const [costTotal, setCostTotal] = useState("");
  const [costCurrency, setCostCurrency] = useState("USD");
  const [feeAmount, setFeeAmount] = useState("0");
  const [feeCurrency, setFeeCurrency] = useState("USD");
  const [feeTreatment, setFeeTreatment] = useState("expense");
  const [fxRate, setFxRate] = useState("");
  const [businessDate, setBusinessDate] = useState(today());
  const [priceAsOf, setPriceAsOf] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const net = String(
      Number(grossQty) && Number(feeQty)
        ? // display only — Core recomputes; we pass strings
          grossQty
        : grossQty,
    );
    const base = book?.baseCurrency || "IRR";
    const res = await gateway.execute("crypto.buy", {
      operationId: opRef.current,
      payload: {
        instrumentId,
        symbol: instrumentId.includes("-") ? instrumentId.split("-")[0].toUpperCase() : instrumentId.toUpperCase(),
        exchangeId,
        networkId: networkId || undefined,
        venueId: exchangeId,
        grossQuantity: grossQty.trim(),
        feeQuantity: feeQty.trim() || "0",
        // netQuantity omitted — Core derives net = gross - fee (BUG-P0-03)
        costTotal: costTotal.trim() || price.trim(),
        costCurrency,
        currency: costCurrency,
        price: price.trim(),
        priceAsOf,
        businessDate,
        feeRole: feeTreatment,
        feeTreatment,
        feeAmount: feeAmount.trim() || "0",
        feeCurrency,
        exchangeRateToBase: fxRate.trim() || (costCurrency === base ? "1" : undefined),
        baseCurrency: base,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Crypto Buy</h2>
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="exchange / venue" value={exchangeId} onChange={setExchangeId} required />
      <Field label="network (optional)" value={networkId} onChange={setNetworkId} />
      <Field label="gross quantity" value={grossQty} onChange={setGrossQty} required />
      <Field label="fee quantity" value={feeQty} onChange={setFeeQty} />
      <Field label="price" value={price} onChange={setPrice} required />
      <Field label="cost total (or leave = price)" value={costTotal} onChange={setCostTotal} />
      <Field label="cost currency" value={costCurrency} onChange={(v) => setCostCurrency(v.toUpperCase())} required />
      <Field label="fee amount" value={feeAmount} onChange={setFeeAmount} />
      <Field label="fee currency" value={feeCurrency} onChange={(v) => setFeeCurrency(v.toUpperCase())} />
      <label>
        fee treatment
        <select value={feeTreatment} onChange={(e) => setFeeTreatment(e.target.value)}>
          <option value="expense">expense</option>
          <option value="reduce_received_quantity">reduce_received_quantity</option>
          <option value="capitalize_inventory">capitalize_inventory</option>
        </select>
      </label>
      <Field label="FX to book base (required if ccy ≠ base)" value={fxRate} onChange={setFxRate} />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      <Field label="price as-of" value={priceAsOf} onChange={setPriceAsOf} type="date" required />
      <p className="muted">مقادیر مالی فقط string · بدون Number در Core</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : "ثبت"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function CryptoSellSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const { book } = useAppState();
  const opRef = useRef(crypto.randomUUID());
  const [holdingId, setHoldingId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [proceeds, setProceeds] = useState("");
  const [proceedsCurrency, setProceedsCurrency] = useState("USD");
  const [feeAmount, setFeeAmount] = useState("0");
  const [businessDate, setBusinessDate] = useState(today());
  const [fxRate, setFxRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const base = book?.baseCurrency || "IRR";
    const res = await gateway.execute("crypto.sell", {
      operationId: opRef.current,
      payload: {
        holdingId: holdingId || undefined,
        instrumentId,
        quantity: quantity.trim(),
        proceedsTotal: proceeds.trim(),
        proceedsCurrency,
        currency: proceedsCurrency,
        feeAmount: feeAmount.trim() || "0",
        feeCurrency: proceedsCurrency,
        businessDate,
        exchangeRateToBase: fxRate.trim() || (proceedsCurrency === base ? "1" : undefined),
        baseCurrency: base,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Crypto Sell</h2>
      <Field label="holdingId (optional)" value={holdingId} onChange={setHoldingId} />
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="quantity" value={quantity} onChange={setQuantity} required />
      <Field label="proceeds total" value={proceeds} onChange={setProceeds} required />
      <Field label="proceeds currency" value={proceedsCurrency} onChange={(v) => setProceedsCurrency(v.toUpperCase())} required />
      <Field label="fee amount" value={feeAmount} onChange={setFeeAmount} />
      <Field label="FX to base" value={fxRate} onChange={setFxRate} />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function CryptoTransferSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="form">
      <h2 id="sheet-title">Crypto Transfer</h2>
      <p className="muted">internal transfer · no realized P&amp;L · fee funding explicit</p>
      <Button type="button" variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}

export function StocksBuySheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const { book } = useAppState();
  const opRef = useRef(crypto.randomUUID());
  const [brokerageId, setBrokerageId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("0");
  const [tax, setTax] = useState("0");
  const [otherFee, setOtherFee] = useState("0");
  const [currency, setCurrency] = useState("IRR");
  const [tradeDate, setTradeDate] = useState(today());
  const [settlementDate, setSettlementDate] = useState(today());
  const [fxRate, setFxRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const base = book?.baseCurrency || "IRR";
    const res = await gateway.execute("stocks.buy", {
      operationId: opRef.current,
      payload: {
        brokerageId,
        instrumentId,
        quantity: quantity.trim(),
        price: price.trim(),
        commission: commission.trim() || "0",
        tax: tax.trim() || "0",
        otherFee: otherFee.trim() || "0",
        currency,
        tradeDate,
        settlementDate,
        businessDate: tradeDate,
        exchangeRateToBase: fxRate.trim() || (currency === base ? "1" : undefined),
        baseCurrency: base,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Stocks Buy</h2>
      <Field label="brokerageId" value={brokerageId} onChange={setBrokerageId} required />
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="quantity" value={quantity} onChange={setQuantity} required />
      <Field label="price" value={price} onChange={setPrice} required />
      <Field label="commission" value={commission} onChange={setCommission} />
      <Field label="tax / withholding" value={tax} onChange={setTax} />
      <Field label="other fee" value={otherFee} onChange={setOtherFee} />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      <Field label="trade date" value={tradeDate} onChange={setTradeDate} type="date" required />
      <Field label="settlement date" value={settlementDate} onChange={setSettlementDate} type="date" required />
      <Field label="FX to base" value={fxRate} onChange={setFxRate} />
      <p className="muted">tradeDate ≠ settlementDate · T+n explicit</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function StocksSellSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [brokerageId, setBrokerageId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("0");
  const [tradeDate, setTradeDate] = useState(today());
  const [settlementDate, setSettlementDate] = useState(today());
  const [currency, setCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("stocks.sell", {
      operationId: opRef.current,
      payload: {
        brokerageId,
        instrumentId,
        quantity: quantity.trim(),
        price: price.trim(),
        commission: commission.trim() || "0",
        currency,
        tradeDate,
        settlementDate,
        businessDate: tradeDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Stocks Sell</h2>
      <Field label="brokerageId" value={brokerageId} onChange={setBrokerageId} required />
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="quantity" value={quantity} onChange={setQuantity} required />
      <Field label="price" value={price} onChange={setPrice} required />
      <Field label="commission" value={commission} onChange={setCommission} />
      <Field label="trade date" value={tradeDate} onChange={setTradeDate} type="date" required />
      <Field label="settlement date" value={settlementDate} onChange={setSettlementDate} type="date" required />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function StocksDividendSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [instrumentId, setInstrumentId] = useState("");
  const [gross, setGross] = useState("");
  const [withholding, setWithholding] = useState("0");
  const [payDate, setPayDate] = useState(today());
  const [exDate, setExDate] = useState(today());
  const [currency, setCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("stocks.dividend", {
      operationId: opRef.current,
      payload: {
        instrumentId,
        grossAmount: gross.trim(),
        withholdingTax: withholding.trim() || "0",
        currency,
        payDate,
        exDate,
        businessDate: payDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Dividend</h2>
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="gross" value={gross} onChange={setGross} required />
      <Field label="withholding tax" value={withholding} onChange={setWithholding} />
      <Field label="ex date" value={exDate} onChange={setExDate} type="date" required />
      <Field label="pay date" value={payDate} onChange={setPayDate} type="date" required />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function FundsSubscribeSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [instrumentId, setInstrumentId] = useState("");
  const [units, setUnits] = useState("");
  const [transactionPrice, setTxPrice] = useState("");
  const [nav, setNav] = useState("");
  const [pricingMode, setPricingMode] = useState("transaction_price");
  const [currency, setCurrency] = useState("IRR");
  const [businessDate, setBusinessDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("funds.subscribe", {
      operationId: opRef.current,
      payload: {
        instrumentId,
        units: units.trim(),
        quantity: units.trim(),
        transactionPrice: transactionPrice.trim() || undefined,
        nav: nav.trim() || undefined,
        pricingMode,
        currency,
        businessDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Funds Subscribe</h2>
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="units" value={units} onChange={setUnits} required />
      <label>
        pricing mode
        <select value={pricingMode} onChange={(e) => setPricingMode(e.target.value)}>
          <option value="transaction_price">transaction_price</option>
          <option value="nav">nav (explicit)</option>
          <option value="amount">amount-based</option>
        </select>
      </label>
      <Field label="transaction price" value={transactionPrice} onChange={setTxPrice} />
      <Field label="NAV observation (optional)" value={nav} onChange={setNav} />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      <p className="muted">NAV ≠ transactionPrice unless mode explicit · reinvest deferred</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function FundsRedeemSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [instrumentId, setInstrumentId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [units, setUnits] = useState("");
  const [transactionPrice, setTxPrice] = useState("");
  const [proceedsTotal, setProceeds] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [businessDate, setBusinessDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (transactionPrice && proceedsTotal) {
      setError("فقط یکی از transactionPrice یا proceedsTotal");
      setSubmitting(false);
      return;
    }
    const res = await gateway.execute("funds.redeem", {
      operationId: opRef.current,
      payload: {
        instrumentId,
        accountId: accountId || undefined,
        units: units.trim(),
        transactionPrice: transactionPrice.trim() || undefined,
        proceedsTotal: proceedsTotal.trim() || undefined,
        currency,
        businessDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Funds Redeem</h2>
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="accountId (if multi-holding)" value={accountId} onChange={setAccountId} />
      <Field label="units" value={units} onChange={setUnits} required />
      <Field label="transaction price XOR" value={transactionPrice} onChange={setTxPrice} />
      <Field label="proceeds total XOR" value={proceedsTotal} onChange={setProceeds} />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function MetalsBuySheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [platformId, setPlatformId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [quantityMg, setQty] = useState("");
  const [purityRatio, setPurity] = useState(""); // empty unless instrument purityPolicy=fixed_1 (BUG-P0-04)
  const [metalPricePerMg, setPrice] = useState("");
  const [premium, setPremium] = useState("0");
  const [feeAmount, setFee] = useState("0");
  const [currency, setCurrency] = useState("IRR");
  const [businessDate, setBusinessDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("metals.buy", {
      operationId: opRef.current,
      payload: {
        platformId,
        instrumentId,
        quantityMg: quantityMg.trim(),
        grossWeight: quantityMg.trim(),
        purityRatio: purityRatio.trim(),
        metalPricePerMg: metalPricePerMg.trim(),
        premiumAmount: premium.trim() || "0",
        feeAmount: feeAmount.trim() || "0",
        currency,
        businessDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Metals Buy</h2>
      <Field label="platformId" value={platformId} onChange={setPlatformId} required />
      <Field label="instrumentId" value={instrumentId} onChange={setInstrumentId} required />
      <Field label="gross mass (mg)" value={quantityMg} onChange={setQty} required />
      <Field label="purity ratio" value={purityRatio} onChange={setPurity} required />
      <Field label="metal price per mg" value={metalPricePerMg} onChange={setPrice} required />
      <Field label="premium" value={premium} onChange={setPremium} />
      <Field label="trade fee" value={feeAmount} onChange={setFee} />
      <Field label="currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} required />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      <p className="muted">gross · purity · fine · premium · fee جدا</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export function MetalsDeliverySheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const opRef = useRef(crypto.randomUUID());
  const [holdingId, setHoldingId] = useState("");
  const [quantityMg, setQty] = useState("");
  const [deliveryFee, setFee] = useState("0");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [businessDate, setBusinessDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("metals.delivery", {
      operationId: opRef.current,
      payload: {
        holdingId,
        quantityMg: quantityMg.trim(),
        deliveryFee: deliveryFee.trim() || "0",
        serialNumber: serial || undefined,
        location: location || undefined,
        businessDate,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 id="sheet-title">Metals Delivery</h2>
      <Field label="holdingId" value={holdingId} onChange={setHoldingId} required />
      <Field label="quantity mg" value={quantityMg} onChange={setQty} required />
      <Field label="delivery fee" value={deliveryFee} onChange={setFee} />
      <Field label="serial / certificate" value={serial} onChange={setSerial} />
      <Field label="location" value={location} onChange={setLocation} />
      <Field label="business date" value={businessDate} onChange={setBusinessDate} type="date" required />
      <p className="muted">delivery fee ≠ trade fee · acquisition cost silent نیست</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          ثبت
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
