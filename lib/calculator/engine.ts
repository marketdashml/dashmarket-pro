import type { CalculatorInput, CalculatorResult, WhatIfAdjustment, WhatIfResult } from "./types";

// ─── Core calculation ────────────────────────────────────────────────────────
export function calculateCosts(input: CalculatorInput): CalculatorResult {
  const {
    sellingPrice,
    productCost,
    commissionPercentage,
    fixedFee,
    taxPercentage,
    shippingCost,
    packagingCost,
    storageCost,
    collectionCost,
    operationalCost,
    promotionCredit,
    affiliateCommissionPercentage,
    tacosPercentage
  } = input;

  const commission = sellingPrice * (commissionPercentage / 100);
  const taxes = sellingPrice * (taxPercentage / 100);
  const affiliateCommission = sellingPrice * (affiliateCommissionPercentage / 100);
  const tacosCost = sellingPrice * (tacosPercentage / 100);

  const totalCosts =
    productCost +
    commission +
    fixedFee +
    taxes +
    shippingCost +
    packagingCost +
    storageCost +
    collectionCost +
    operationalCost +
    affiliateCommission +
    tacosCost;

  const netProfit = sellingPrice - totalCosts + promotionCredit;
  const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markup = productCost > 0 ? (netProfit / productCost) * 100 : 0;

  return {
    sellingPrice,
    productCost,
    commission,
    fixedFee,
    taxes,
    shippingCost,
    packagingCost,
    storageCost,
    collectionCost,
    operationalCost,
    promotionCredit,
    affiliateCommission,
    tacosCost,
    tacosPercentage,
    totalCosts,
    netProfit,
    profitMargin,
    markup
  };
}

// ─── Price from desired margin ────────────────────────────────────────────────
export function calculatePriceFromMargin(
  input: Omit<CalculatorInput, "sellingPrice">,
  desiredMargin: number
): number {
  const variablePercent =
    input.commissionPercentage +
    input.taxPercentage +
    input.affiliateCommissionPercentage +
    input.tacosPercentage +
    desiredMargin;

  const fixedCosts =
    input.productCost +
    input.fixedFee +
    input.shippingCost +
    input.packagingCost +
    input.storageCost +
    input.collectionCost +
    input.operationalCost;

  const denominator = 1 - variablePercent / 100;
  if (denominator <= 0) return 0;
  return (fixedCosts - input.promotionCredit) / denominator;
}

// ─── Price from fixed profit amount ──────────────────────────────────────────
export function calculatePriceFromFixedProfit(
  input: Omit<CalculatorInput, "sellingPrice">,
  desiredProfit: number
): number {
  const variablePercent =
    input.commissionPercentage +
    input.taxPercentage +
    input.affiliateCommissionPercentage +
    input.tacosPercentage;

  const fixedCosts =
    input.productCost +
    input.fixedFee +
    input.shippingCost +
    input.packagingCost +
    input.storageCost +
    input.collectionCost +
    input.operationalCost;

  const denominator = 1 - variablePercent / 100;
  if (denominator <= 0) return 0;
  return (fixedCosts + desiredProfit - input.promotionCredit) / denominator;
}

// ─── Minimum suggested price (at desired margin) ─────────────────────────────
export function suggestedPrice(input: CalculatorInput, minMargin: number): number {
  return calculatePriceFromMargin(
    { ...input, sellingPrice: 0 } as Omit<CalculatorInput, "sellingPrice">,
    minMargin
  );
}

// ─── What-if simulation ───────────────────────────────────────────────────────
export function simulateWhatIf(
  base: CalculatorInput,
  baseResult: CalculatorResult,
  adj: WhatIfAdjustment
): WhatIfResult {
  const newPrice = base.sellingPrice * (1 + adj.priceAdjust / 100);
  const newCommission = Math.max(0, base.commissionPercentage + adj.commissionAdjust);
  const newShipping = Math.max(0, base.shippingCost + adj.shippingAdjust);
  const newTax = Math.max(0, base.taxPercentage + adj.taxAdjust);

  const simResult = calculateCosts({
    ...base,
    sellingPrice: newPrice,
    commissionPercentage: newCommission,
    shippingCost: newShipping,
    taxPercentage: newTax
  });

  return {
    newPrice,
    netProfit: simResult.netProfit,
    profitMargin: simResult.profitMargin,
    originalProfit: baseResult.netProfit,
    originalMargin: baseResult.profitMargin,
    profitDiff: simResult.netProfit - baseResult.netProfit,
    marginDiff: simResult.profitMargin - baseResult.profitMargin
  };
}
