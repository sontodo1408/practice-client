// Subscription plans that raise the daily bean limit. Prices are in VND per month.
export interface Plan {
  id: string
  name: string
  // Beans the user may spend per day on this plan
  dailyBeans: number
  // Monthly price in VND; 0 means free
  monthlyPrice: number
  // Highlighted as the recommended choice
  popular?: boolean
}

export type BillingCycle = 'month' | 'year'

// Discount applied when paying for a whole year up front (10%)
export const YEARLY_DISCOUNT = 0.1

export const PLANS: Plan[] = [
  { id: 'free', name: 'Miễn phí', dailyBeans: 30, monthlyPrice: 0 },
  { id: 'basic', name: 'Cơ bản', dailyBeans: 200, monthlyPrice: 15000 },
  { id: 'plus', name: 'Nâng cao', dailyBeans: 500, monthlyPrice: 25000, popular: true },
  { id: 'pro', name: 'Chuyên nghiệp', dailyBeans: 2000, monthlyPrice: 50000 }
]

// Total amount charged for one billing period (12 months minus the discount for yearly)
export function planPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === 'year' ? Math.round(plan.monthlyPrice * 12 * (1 - YEARLY_DISCOUNT)) : plan.monthlyPrice
}

// Effective monthly cost, used to show what yearly billing saves
export function planMonthlyEquivalent(plan: Plan, cycle: BillingCycle): number {
  return cycle === 'year' ? Math.round(planPrice(plan, cycle) / 12) : plan.monthlyPrice
}

// "15.000đ" style label
export function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`
}
