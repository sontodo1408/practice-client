// One selectable image
export interface Image {
  // Label shown under the thumbnail in the picker dialog
  name: string
  // Public URL (the file sits in /public, so no hashing or import is needed)
  src: string
}

// A folder of images, shown as one tab/section in the picker dialog
export interface ImageGroup {
  // Folder key and display title
  key: string
  title: string
  images: Image[]
}

// Builds a full URL from a group folder and a file name
const img = (group: string, file: string, name: string): Image => ({
  name,
  src: `${group}/${file}`
})

// Add new images here after copying the file into the matching folder (16:9, about 640x360, WebP)
export const SUBJECT_IMAGE_GROUPS: ImageGroup[] = [
  {
    key: 'banner',
    title: 'Banner',
    images: [
      img('banner', 'img_db.png', 'Database'),
      img('banner', 'img_java_core.png', 'Java Core'),
      img('banner', 'img_spring_boot.png', 'Spring Boot')
    ]
  },
  {
    key: 'public',
    title: 'Chung',
    images: []
  }
]

// Flat list of every image, handy for lookups
export const ALL_SUBJECT_IMAGES: Image[] = SUBJECT_IMAGE_GROUPS.flatMap(group => group.images)

// True when the stored path is one of the known images (use it to fall back to the icon when it is not)
export const isKnownSubjectImage = (src: string | null | undefined) =>
  !!src && ALL_SUBJECT_IMAGES.some(image => image.src === src)

export const imgUrl = (src: string | null | undefined) => `/imgs/${src}`;