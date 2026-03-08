export interface JournalEntry {
  id: string
  decision: string
  optionA: string
  optionB: string
  timestamp: number
  chosenPath?: 'A' | 'B'
  scoreA: number
  scoreB: number
  source: string
  winner: 'A' | 'B' | 'tie'
}

const JOURNAL_KEY = 'parallelme_journal'

export function getJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToJournal(entry: Omit<JournalEntry, 'id' | 'timestamp'>): JournalEntry {
  const journal = getJournal()
  const newEntry: JournalEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
  }
  // Deduplicate by decision text, keep newest
  const updated = [newEntry, ...journal.filter((e) => e.decision !== entry.decision)].slice(0, 30)
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated))
  return newEntry
}

export function updateJournalChoice(id: string, chosenPath: 'A' | 'B') {
  const journal = getJournal().map((e) => e.id === id ? { ...e, chosenPath } : e)
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal))
  return journal
}

export function deleteFromJournal(id: string): JournalEntry[] {
  const journal = getJournal().filter((e) => e.id !== id)
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal))
  return journal
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
