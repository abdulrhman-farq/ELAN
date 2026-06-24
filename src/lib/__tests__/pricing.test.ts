import { describe, it, expect } from "vitest";
import {
  computePrice,
  grossFromNet,
  netFromGross,
  sarToHalalas,
  halalasToSar,
  DEFAULT_CLASS_NET_HALALAS,
  VAT_BPS,
} from "../pricing";

describe("computePrice — class value accounting (halalas)", () => {
  it("dossier default: net 150 SAR + 15% VAT = 172.50 gross", () => {
    expect(computePrice({ baseNetHalalas: DEFAULT_CLASS_NET_HALALAS })).toEqual({
      baseNetHalalas: 15000,
      discountAmountHalalas: 0,
      finalNetHalalas: 15000,
      vatBps: VAT_BPS,
      vatAmountHalalas: 2250,
      finalGrossHalalas: 17250,
    });
  });

  it("percentage discount applies to net before VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 1000 }); // 10%
    expect(r.discountAmountHalalas).toBe(1500);
    expect(r.finalNetHalalas).toBe(13500);
    expect(r.vatAmountHalalas).toBe(2025);
    expect(r.finalGrossHalalas).toBe(15525);
  });

  it("fixed discount applies to net before VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "fixed", discountValue: 5000 }); // 50 SAR
    expect(r.finalNetHalalas).toBe(10000);
    expect(r.vatAmountHalalas).toBe(1500);
    expect(r.finalGrossHalalas).toBe(11500);
  });

  it("final net can never go below 0 (fixed discount clamped)", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "fixed", discountValue: 20000 });
    expect(r.discountAmountHalalas).toBe(15000);
    expect(r.finalNetHalalas).toBe(0);
    expect(r.vatAmountHalalas).toBe(0);
    expect(r.finalGrossHalalas).toBe(0);
  });

  it("100% percentage discount (complimentary) zeroes net and VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 10000 });
    expect(r.finalNetHalalas).toBe(0);
    expect(r.finalGrossHalalas).toBe(0);
  });

  it("percentage above 100% is capped at 100%", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 50000 });
    expect(r.finalNetHalalas).toBe(0);
  });

  it("negative / NaN base is treated as 0", () => {
    expect(computePrice({ baseNetHalalas: -100 }).finalGrossHalalas).toBe(0);
    expect(computePrice({ baseNetHalalas: NaN }).finalGrossHalalas).toBe(0);
  });
});

describe("VAT helpers", () => {
  it("grossFromNet matches the engine", () => {
    expect(grossFromNet(15000)).toBe(17250);
  });
  it("netFromGross inverts a VAT-inclusive price", () => {
    expect(netFromGross(17250)).toBe(15000);
  });
  it("sar/halalas round-trip", () => {
    expect(sarToHalalas(172.5)).toBe(17250);
    expect(halalasToSar(17250)).toBe(172.5);
  });
});
