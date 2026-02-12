// Billing Configuration - Product and entitlement identifiers for RevenueCat

import { Capacitor } from '@capacitor/core';

// Entitlement identifier - matches RevenueCat dashboard
export const ENTITLEMENT_ID = 'npd Pro';

// Product identifiers - matches RevenueCat dashboard and store products
export const BILLING_CONFIG = {
  weekly: {
    productId: 'npd_wk',
    basePlanId: 'npd-wk-plan',
    offerId: 'npd-wk-trial',
  },
  monthly: {
    productId: 'monthly',
    basePlanId: 'npd-mo',
    offerId: 'npd-monthly-offer',
  },
  yearly: {
    productId: 'yearly',
    basePlanId: 'npd-yearly-plan',
    offerId: 'npd-yearly-trial',
  },
} as const;

export type PlanType = keyof typeof BILLING_CONFIG;

export interface SubscriptionProduct {
  productId: string;
  basePlanId: string;
  offerId: string;
}

export const getSubscriptionDetails = (plan: PlanType): SubscriptionProduct => {
  return BILLING_CONFIG[plan];
};

// Pricing display (for UI only - actual pricing comes from RevenueCat/Store)
export const PRICING_DISPLAY = {
  weekly: {
    price: '$2.99',
    period: 'week',
    displayPrice: '$2.99/wk',
    trialDays: 1,
  },
  monthly: {
    price: '$4.99',
    period: 'month',
    displayPrice: '$4.99/mo',
  },
  yearly: {
    price: '$35.88',
    period: 'year',
    monthlyEquivalent: '$2.99/mo',
    displayPrice: '$2.99/mo',
    trialDays: 3,
  },
} as const;

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};
