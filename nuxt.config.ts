// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/mdc'],
  // Auto-import stores from app/stores
  imports: { dirs: ['stores'] },
  css: ['~/assets/css/main.css'],
  app: {
    // Favicon uses the brand logo from /public
    head: {
      htmlAttrs: { lang: 'vi' },
      titleTemplate: (title?: string) => (title ? `${title} | Practice` : 'Practice'),
      link: [{ rel: 'icon', type: 'image/png', href: '/logo.png' }],
      meta: [{ property: 'og:site_name', content: 'Practice' }, { property: 'og:locale', content: 'vi_VN' }]
    },
    // Animated route/layout changes; CSS lives in main.css (.page-*)
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' }
  },
  runtimeConfig: {
    public: {
      // Public origin of the site, used for canonical URLs and og:url (override with NUXT_PUBLIC_SITE_URL)
      siteUrl: 'https://practice.sontd.io.vn',
      // API gateway (port 50000) + global prefix; services live under /identity, /practice, /profile
      apiBase: 'http://localhost:50000/api/v1',
      // Google OAuth web client id (same one as the backend GOOGLE_CLIENT_ID); override with NUXT_PUBLIC_GOOGLE_CLIENT_ID
      googleClientId: '400239326113-5irehn2qafd3m1tsas4ufikhgsnsjgpd.apps.googleusercontent.com'
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
