<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-50 px-4 py-10 dark:bg-neutral-950">
    <!-- Centered layout for unauthenticated screens with a soft brand-colored backdrop -->
    <!-- Decorative blobs (purely visual, hidden from assistive tech) -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div class="animate-float-slow absolute -top-24 -left-24 size-96 rounded-full bg-brand-200 blur-3xl dark:bg-brand-900/40" />
      <div class="animate-float-slow absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-300/60 blur-3xl [animation-delay:2s] dark:bg-brand-800/30" />
    </div>

    <!-- Page content sits above the backdrop -->
    <main class="relative w-full max-w-md">
      <slot />
    </main>
  </div>
</template>
