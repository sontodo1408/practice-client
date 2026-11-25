<script setup lang="ts">
import type { Plan, BillingCycle } from '~/utils/plans'

// Popup content: compares the plans that raise the daily bean limit.
// Payment is not wired up yet, so choosing a paid plan only shows a notice.
const emit = defineEmits<{ close: [value?: boolean] }>()
const toast = useToast()

// Billing cycle toggle: monthly or yearly (10% off)
const cycle = ref<BillingCycle>('month')
const cycleItems = [
  { label: 'Theo tháng', value: 'month' },
  { label: 'Theo năm', value: 'year' }
]

// Pick a plan; the free plan needs no action, paid plans will lead to payment later
function choose(plan: Plan) {
  if (plan.monthlyPrice === 0) {
    emit('close')
    return
  }
  toast.add({
    title: 'Thanh toán sắp ra mắt',
    description: `Gói ${plan.name} sẽ có thể mua trong thời gian tới.`,
    color: 'info',
    icon: 'i-lucide-info'
  })
}
</script>

<template>
  <div class="space-y-5">
    <!-- Intro + billing cycle toggle -->
    <div class="flex flex-col items-center gap-3 text-center">
      <p class="text-sm text-muted">
        Nâng cấp để tăng số bean mỗi ngày và luyện tập thoải mái hơn.
      </p>
      <UTabs
        v-model="cycle"
        :items="cycleItems"
        :content="false"
        size="sm"
        class="w-full max-w-xs"
        aria-label="Chu kỳ thanh toán"
      />
      <!-- Yearly hint, shown only while yearly is selected; the wrapper keeps a fixed height so the layout never jumps -->
      <div class="flex h-6 items-center">
        <Transition name="fade">
          <UBadge v-if="cycle === 'year'" color="success" variant="subtle" icon="i-lucide-badge-percent">
            Giảm {{ YEARLY_DISCOUNT * 100 }}% khi thanh toán theo năm
          </UBadge>
        </Transition>
      </div>
    </div>

    <!-- Plan cards: 1 column on mobile, 2 on tablet, 4 on desktop -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(plan, index) in PLANS"
        :key="plan.id"
        class="motion-safe:animate-fade-up relative flex flex-col rounded-xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        :class="plan.popular ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-default bg-default'"
        :style="{ '--index': index }"
      >
        <!-- Recommended ribbon -->
        <UBadge v-if="plan.popular" class="absolute -top-2.5 left-1/2 -translate-x-1/2" size="sm">
          Phổ biến
        </UBadge>

        <h3 class="font-semibold text-highlighted">
          {{ plan.name }}
        </h3>

        <!-- Price -->
        <div class="mt-3 h-[4.25rem]">
          <template v-if="plan.monthlyPrice === 0">
            <span class="text-3xl font-bold text-highlighted">0đ</span>
          </template>
          <template v-else>
            <span class="text-3xl font-bold tabular-nums text-highlighted">{{ formatVnd(planPrice(plan, cycle)) }}</span>
            <span class="text-sm text-muted"> / {{ cycle === 'year' ? 'năm' : 'tháng' }}</span>
            <!-- Yearly: show the effective monthly price and the struck-through full price (hidden, not removed, in monthly mode) -->
            <p class="mt-1 h-4 text-xs text-muted" :class="{ invisible: cycle !== 'year' }">
              ≈ {{ formatVnd(planMonthlyEquivalent(plan, 'year')) }}/tháng
              <span class="ml-1 line-through">{{ formatVnd(plan.monthlyPrice * 12) }}</span>
            </p>
          </template>
        </div>

        <!-- Benefit -->
        <div class="mt-4 flex items-center gap-2 rounded-lg bg-elevated px-3 py-2">
          <img src="/imgs/general/img_golden_bean.png" alt="" class="size-5 object-contain">
          <span class="text-sm font-semibold tabular-nums text-highlighted">{{ plan.dailyBeans }}</span>
          <span class="text-sm text-muted">bean / ngày</span>
        </div>

        <UButton
          class="mt-4 justify-center transition duration-200 active:scale-95"
          :color="plan.popular ? 'primary' : 'neutral'"
          :variant="plan.monthlyPrice === 0 ? 'outline' : plan.popular ? 'solid' : 'soft'"
          block
          @click="choose(plan)"
        >
          {{ plan.monthlyPrice === 0 ? 'Gói mặc định' : 'Chọn gói' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fade for the yearly discount badge */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
