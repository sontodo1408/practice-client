// Vocabulary set as returned by GET /vocab/set (mirrors Java VocabSetProjection)
export interface VocabSet {
  id: number
  name: string
  slug: string
  description: string | null
  // Banner path inside /imgs; resolve with imgUrl()
  imgBanner: string | null
  createdAt: string
  updatedAt: string
  // Number of words in the set
  wordNum: number | null
}

// Admin form payload for creating/updating a set (mirrors Java VocabSetCreateRequest; id set = update)
export interface VocabSetPayload {
  id?: number
  // Owner of the set; only sent by the user-facing create (POST /vocab/set), unused by the admin API
  userId?: number
  name: string
  description: string
  imgBanner: string | null
}

// Word type and CEFR level (mirror Java EWordType / EWordLevel; "ADB" is the backend spelling of adverb)
export type VocabWordType = 'NOUN' | 'VERB' | 'ADJ' | 'ADB' | 'PREP' | 'CONJ'
export type VocabWordLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// Word inside a set (mirrors Java VocabWordEntity)
export interface VocabWord {
  id: number
  setId: number
  word: string
  phonetic: string | null
  wordType: VocabWordType | null
  wordLevel: VocabWordLevel | null
  meaning: string
  example: string | null
}

// Admin form payload for a word (id set = update)
export interface VocabWordPayload {
  id?: number
  setId: number
  word: string
  phonetic: string
  wordType: VocabWordType | undefined
  wordLevel: VocabWordLevel | undefined
  meaning: string
  example: string
}

// Select options shared by the word form and the word table
export const VOCAB_WORD_TYPES: { label: string, value: VocabWordType }[] = [
  { label: 'Danh từ', value: 'NOUN' },
  { label: 'Động từ', value: 'VERB' },
  { label: 'Tính từ', value: 'ADJ' },
  { label: 'Trạng từ', value: 'ADB' },
  { label: 'Giới từ', value: 'PREP' },
  { label: 'Liên từ', value: 'CONJ' }
]
export const VOCAB_WORD_LEVELS: VocabWordLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// Set with its words as returned by GET /vocab/set/{slug} (mirrors Java VocabSetDTO with vocabWords)
export interface VocabSetDetail {
  id: number
  name: string
  slug: string
  description: string | null
  imgBanner: string | null
  // Owner of the set; the page compares it with the signed-in user to decide who may add words
  userId?: number | null
  // The backend leaves this null when a set has no words
  vocabWords: VocabWord[] | null
}

// Request from the search box on the set page to jump to a word; "n" changes on every request so searching
// the same word twice still triggers the study modes
export interface VocabFocus {
  id: number
  n: number
}
