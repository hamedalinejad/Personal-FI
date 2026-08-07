# نکات طراحی: مدیریت کارمزد و ارز در فیچرهای سرمایه‌گذاری

## فلسفه کلی

در تمام زیر‌فیچرهای سرمایه‌گذاری (Crypto, Stocks-Iran, Fixed-Income-Funds, Metals)، از رویکرد یکپارچه برای مدیریت کارمزدها استفاده می‌شود:

### قبل (قدیمی و تکراری):
- ذخیره `feeValueIRR` و `feeValueUSDT` هر دو
- تکرار ریاضی: `feeValueUSDT = feeValueIRR / exchangeRateToUSDT`
- پیچیدگی کد و احتمال ناسازگاری داده

### بعد (استاندارد جدید):
- ذخیره فقط: `feeAmount` + `feeCurrency` + `exchangeRateToUSDT`
- محاسبه on-the-fly با تابع: `convert(amount, fromCurrency, toCurrency, exchangeRate)`
- نگهداری `totalFeesPaid` + `totalFeesPaidCurrency` برای جمع‌آوری کل کارمزدها

---

## فیلدهای استاندارد

### جدول تراکنش‌ها:
| فیلد | نوع | توضیح |
|------|------|------|
| `feeAmount` | decimal | مقدار کارمزد |
| `feeCurrency` | string | ارز کارمزد (IRR, USDT, BTC و ...) |
| `exchangeRateToUSDT` | decimal | نرخ تتر لحظه معامله |

### جدول Holding:
| فیلد | نوع | توضیح |
|------|------|------|
| `totalFeesPaid` | decimal | مجموع کارمزدها |
| `totalFeesPaidCurrency` | string | ارز پایه برای جمع‌آوری (IRR یا USDT) |

---

## منطق تبدیل (convert function)

```typescript
// pseudo-code
function convert(amount: number, fromCurrency: string, toCurrency: string, exchangeRateToUSDT: number): number {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'IRR' && toCurrency === 'USDT') {
    return amount / exchangeRateToUSDT;
  }
  if (fromCurrency === 'USDT' && toCurrency === 'IRR') {
    return amount * exchangeRateToUSDT;
  }
  
  // پیچیده‌تر (مثلاً BTC → IRR): باید از چندین نرخ استفاده کرد
  // BTC → USDT (با نرخ مربوط به BTC) → IRR (با exchangeRateToUSDT)
  throw new Error('Conversion logic needs multi-step rates');
}
```

---

## نکات پیاده‌سازی

1. **یکسان‌سازی نام فیلد نرخ ارز**: همه فایل‌ها از `exchangeRateToUSDT` استفاده می‌کنند
2. **ذخیره لحظه**: نرخ تتر لحظه هر معامله ثبت و قفل می‌شود
3. **جمع‌آوری در Holding**: مجموع کارمزدها با یک ارز ثابت نگهداری می‌شود (مثلاً همیشه IRR)
4. **نمایش به کاربر**: ارزش معادل به هر ارزی می‌تواند با تابع convert محاسبه شود

---

## مزایای روش جدید

- کاهش ۲ فیلد در هر جدول تراکنش و هولディング (در کل پروژه)
- کاهش پیچیدگی کد (یک تابع convert به جای چندین if-else)
- جلوگیری از تضاد داده (هرگز `feeValueIRR / exchangeRate` با `feeValueUSDT` مغایرت ندارد)
- مناسب برای اپ تک‌کاربره شخصی