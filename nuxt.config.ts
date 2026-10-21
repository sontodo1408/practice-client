// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  // Auto-import stores from app/stores
  imports: { dirs: ['stores'] },
  css: ['~/assets/css/main.css'],
  app: {
    // Favicon uses the brand logo from /public
    head: {
      link: [{ rel: 'icon', type: 'image/png', href: '/logo.png' }]
    },
    // Animated route/layout changes; CSS lives in main.css (.page-*)
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' }
  },
  runtimeConfig: {
    public: {
      // API gateway (port 50000) + global prefix; services live under /identity, /practice, /profile
      apiBase: 'http://localhost:50000/api/v1'
    }
  },

  hooks: {
    // Nuxt UI adds reka-ui to build.transpile, which makes Nuxt exclude it from client pre-bundling. In dev it is
    // then served as ~600 separate files, so every load is slow and hydration is delayed. Pre-bundle it instead.
    'vite:extendConfig'(config, { isClient }) {
      if (!isClient) return
      for (const deps of [config.optimizeDeps, config.environments?.client?.optimizeDeps]) {
        if (!deps) continue
        deps.exclude = deps.exclude?.filter(dep => dep !== 'reka-ui')
        deps.include = [...(deps.include ?? []), 'reka-ui']
      }
    }
  },

  typescript: {
    strict: true
  },
  devtools: { enabled: true }
})
