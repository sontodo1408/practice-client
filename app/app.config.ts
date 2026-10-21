// Point Nuxt UI's semantic `primary` color at the brand palette defined in main.css
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      neutral: 'zinc'
    }
  }
})
