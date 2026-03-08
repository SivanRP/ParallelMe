export interface Milestone {
  year: number
  title: string
  description: string
  emoji: string
  metric: string
}

export interface FutureTimeline {
  id: 'A' | 'B'
  label: string
  theme: 'purple' | 'cyan'
  tagline: string
  milestones: Milestone[]
}

export interface GeneratedFutures {
  futureA: FutureTimeline
  futureB: FutureTimeline
}

type PathType =
  | 'startup'
  | 'career'
  | 'travel'
  | 'creative'
  | 'education'
  | 'relationship'
  | 'default'

function detectPathType(path: string): PathType {
  const p = path.toLowerCase()
  if (/startup|found|entrepreneur|business|venture|build a company/i.test(p)) return 'startup'
  if (/job|career|corporate|company|salary|employee|full.?time|work/i.test(p)) return 'career'
  if (/travel|move|abroad|country|city|relocate|expat/i.test(p)) return 'travel'
  if (/art|music|creative|film|write|paint|design|creative/i.test(p)) return 'creative'
  if (/study|school|degree|university|college|education|phd|master/i.test(p)) return 'education'
  if (/marry|relationship|partner|family|kids|love|propose/i.test(p)) return 'relationship'
  return 'default'
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function parseDecision(raw: string): { pathA: string; pathB: string } {
  const separators = [/ vs\.? /i, / versus /i, / or /i, /\s*\/\s*/, /\s*\|\s*/, /\s*,\s*/]
  for (const sep of separators) {
    const parts = raw.split(sep)
    if (parts.length >= 2) {
      return {
        pathA: parts[0].trim(),
        pathB: parts.slice(1).join(' or ').trim(),
      }
    }
  }
  return { pathA: raw.trim(), pathB: `not ${raw.trim()}` }
}

const primaryMilestones: Record<PathType, Milestone[]> = {
  startup: [
    {
      year: 1,
      title: 'Taking the Leap',
      description:
        'You quit the comfort of a salary and launch with a co-founder. The first product ships after 90 sleepless nights. Early adopters are obsessed.',
      emoji: '🚀',
      metric: '$0 → $12K MRR',
    },
    {
      year: 3,
      title: 'Series A Secured',
      description:
        'After viral traction, top-tier investors take notice. You close a $4M round, rent your first real office, and hire 12 people who believe in the mission.',
      emoji: '💰',
      metric: '$4M raised',
    },
    {
      year: 5,
      title: 'Category Leader',
      description:
        "Your startup becomes the go-to solution in the space. Acquisition offers land weekly. You decline them all — you're just getting started.",
      emoji: '👑',
      metric: '50K customers',
    },
    {
      year: 10,
      title: 'The IPO',
      description:
        "A decade of building culminates on a trading floor. You ring the bell as the company goes public at $1.4B. You're on the covers of magazines you used to read for inspiration.",
      emoji: '🏆',
      metric: '$1.4B valuation',
    },
  ],
  career: [
    {
      year: 1,
      title: 'Solid Foundation',
      description:
        'You settle into a senior role with competitive pay and real benefits. The work-life balance lets you invest in relationships, hobbies, and yourself.',
      emoji: '🏢',
      metric: '$115K salary',
    },
    {
      year: 3,
      title: 'Rising Leader',
      description:
        'A promotion brings management responsibility. You lead a cross-functional team of 10 and own critical product decisions that affect millions of users.',
      emoji: '📈',
      metric: 'Director-level role',
    },
    {
      year: 5,
      title: 'Domain Expert',
      description:
        "You're recognized across the industry. Conferences invite you to keynote. Your network has become your most valuable professional asset.",
      emoji: '🎯',
      metric: '$230K total comp',
    },
    {
      year: 10,
      title: 'Executive Track',
      description:
        'VP at a Fortune 500. Retirement fully funded, equity vesting on schedule, and the authority to shape strategy at the highest level.',
      emoji: '⚖️',
      metric: 'VP / $420K comp',
    },
  ],
  travel: [
    {
      year: 1,
      title: 'New Horizons',
      description:
        'You land with two bags and a one-way ticket. Disorienting for the first month — but every week brings revelations that reshape how you see yourself.',
      emoji: '✈️',
      metric: '14 countries',
    },
    {
      year: 3,
      title: 'Rooted Abroad',
      description:
        "You've found your community. You speak the language, know the streets, and call a culture that once felt foreign completely home.",
      emoji: '🌍',
      metric: '3 cities lived in',
    },
    {
      year: 5,
      title: 'Global Network',
      description:
        'Your international perspective becomes your superpower. You work with clients across continents, earn in multiple currencies, and live on your own schedule.',
      emoji: '🌐',
      metric: 'Remote income secured',
    },
    {
      year: 10,
      title: 'Borderless Life',
      description:
        "You've built a life unconstrained by geography. Property in two countries, friends on every continent, and stories most people only read about.",
      emoji: '🏡',
      metric: 'Dual residency',
    },
  ],
  creative: [
    {
      year: 1,
      title: 'The Blank Canvas',
      description:
        'Scary and exhilarating in equal measure. You create every day — not everything is good, but your voice starts to emerge from the noise.',
      emoji: '🎨',
      metric: 'First 100 pieces',
    },
    {
      year: 3,
      title: 'First Recognition',
      description:
        'A viral piece, a gallery show, a feature in a major publication. The world starts to know your name. Brands reach out.',
      emoji: '🌟',
      metric: '80K followers',
    },
    {
      year: 5,
      title: 'Sustainable Practice',
      description:
        'Your creative work pays the bills — and then some. Commissions, licensing deals, and collaborations with brands you grew up admiring.',
      emoji: '💫',
      metric: 'Full-time creative',
    },
    {
      year: 10,
      title: 'Legacy Work',
      description:
        'A decade of output adds up to a body of work that genuinely changes how people see the world. Awards, retrospectives, and lasting influence.',
      emoji: '🏛️',
      metric: 'Critically acclaimed',
    },
  ],
  education: [
    {
      year: 1,
      title: 'The Student Life',
      description:
        'Late nights, big ideas, lifelong friends. The intellectual environment reshapes how you think about every problem you encounter.',
      emoji: '📚',
      metric: 'Top of class',
    },
    {
      year: 3,
      title: 'Specialization',
      description:
        "You've found your focus. Research publications, mentors who believe in you, and a growing reputation as someone who pushes the field forward.",
      emoji: '🔬',
      metric: '3 papers published',
    },
    {
      year: 5,
      title: 'Graduating Expert',
      description:
        'Your credentials open doors that were previously sealed. Elite research roles, academic positions, or the credibility to launch something entirely new.',
      emoji: '🎓',
      metric: 'PhD / Top program',
    },
    {
      year: 10,
      title: 'Authority',
      description:
        "You're cited, consulted, and considered a leading voice in your field. Your education has compounded into influence that money can't buy.",
      emoji: '🏅',
      metric: 'Industry authority',
    },
  ],
  relationship: [
    {
      year: 1,
      title: 'Choosing Togetherness',
      description:
        'You build daily rituals with someone you love. The ordinary becomes extraordinary when shared with the right person at the right time.',
      emoji: '💑',
      metric: 'Moved in together',
    },
    {
      year: 3,
      title: 'Partnership Deepens',
      description:
        "You've navigated hard seasons together — disagreements, losses, and growth. The trust you've built is the kind most people never find.",
      emoji: '💍',
      metric: 'Committed partners',
    },
    {
      year: 5,
      title: 'Family Grows',
      description:
        'New life, new purpose. Parenthood or chosen family reshapes your priorities in the most profound way imaginable.',
      emoji: '👶',
      metric: 'Family of 3',
    },
    {
      year: 10,
      title: 'Deep Roots',
      description:
        'A decade of growing together. Your home is filled with love, memories, and the quiet certainty that you chose the right person.',
      emoji: '🌳',
      metric: 'A life built together',
    },
  ],
  default: [
    {
      year: 1,
      title: 'The First Step',
      description:
        'Uncertainty gives way to momentum. Small wins accumulate. The decision that once felt enormous begins to feel obvious in retrospect.',
      emoji: '🌱',
      metric: 'Foundation set',
    },
    {
      year: 3,
      title: 'Compound Growth',
      description:
        "Three years of consistent effort shows in ways you didn't expect. You've built skills, habits, and relationships that most people never develop.",
      emoji: '🔥',
      metric: 'Skills compounding',
    },
    {
      year: 5,
      title: 'Recognized Momentum',
      description:
        "Half a decade in and opportunities come to you. You're known for what you bring — and for showing up when it counted.",
      emoji: '⚡',
      metric: 'Major milestone hit',
    },
    {
      year: 10,
      title: 'The Life You Chose',
      description:
        'A decade of small daily decisions has compounded into a life that is unmistakably yours — built with intention, shaped by courage.',
      emoji: '✨',
      metric: 'Life fully aligned',
    },
  ],
}

const alternativeMilestones: Record<PathType, Milestone[]> = {
  startup: [
    {
      year: 1,
      title: 'Stability Chosen',
      description:
        'You took the safer path. A reliable paycheck means no 3am panic attacks — but sometimes, late at night, you wonder about the idea you shelved.',
      emoji: '🛡️',
      metric: 'Financial security',
    },
    {
      year: 3,
      title: 'Steady Progress',
      description:
        'Promotions, good reviews, and a growing reputation. You invest, travel, and sleep soundly. The startup urge fades, but never fully disappears.',
      emoji: '📊',
      metric: 'Director promotion',
    },
    {
      year: 5,
      title: 'Comfortable Life',
      description:
        'By every conventional measure, life is very good. House, savings, and a healthy relationship. The startup idea drifts into the background.',
      emoji: '🏠',
      metric: '$300K net worth',
    },
    {
      year: 10,
      title: 'Well-Lived Stability',
      description:
        "You built a genuinely good life. The entrepreneurial dream becomes a fond 'what if' — but one without regret. Security has its own kind of freedom.",
      emoji: '🌅',
      metric: 'Financially free',
    },
  ],
  career: [
    {
      year: 1,
      title: 'Betting on Yourself',
      description:
        'No salary, no safety net. Pure conviction. The fear is palpable but so is the thrill of total ownership. Every win is entirely yours.',
      emoji: '🎲',
      metric: 'First $6K revenue',
    },
    {
      year: 3,
      title: 'Real Traction',
      description:
        "Revenue is real and growing. You've proven the concept. The team is small but the culture is extraordinary — everyone here chose to be here.",
      emoji: '📈',
      metric: '$35K MRR',
    },
    {
      year: 5,
      title: 'Growing Venture',
      description:
        "Not a billion-dollar exit, but a real business that funds a life entirely on your terms. You set the strategy, the culture, and your own hours.",
      emoji: '🏗️',
      metric: '$2.4M ARR',
    },
    {
      year: 10,
      title: 'Built to Last',
      description:
        'A decade of entrepreneurship gives you what no salary ever could: full ownership, deep meaning, and the right to define success yourself.',
      emoji: '🏛️',
      metric: 'Self-made',
    },
  ],
  travel: [
    {
      year: 1,
      title: 'Roots Deepened',
      description:
        'You stay. Your roots go deeper. The comfort of the known brings a different richness — long friendships, local belonging, and a city that knows your name.',
      emoji: '🏡',
      metric: 'Home strengthened',
    },
    {
      year: 3,
      title: 'Local Mastery',
      description:
        "You know every corner of your city. Deep community ties, local leadership, and a sense of belonging that takes decades to build elsewhere.",
      emoji: '🤝',
      metric: 'Community pillar',
    },
    {
      year: 5,
      title: 'Established',
      description:
        'Property ownership, long friendships, and career stability in a city that knows and respects you. This foundation would take decades to rebuild.',
      emoji: '🌳',
      metric: 'Home ownership',
    },
    {
      year: 10,
      title: 'Deep Roots',
      description:
        "You've built something unmovable — a life fully embedded in a place that knows you, and that you know completely. Legacy is built here.",
      emoji: '🏘️',
      metric: 'Legacy in place',
    },
  ],
  creative: [
    {
      year: 1,
      title: 'Practical Path',
      description:
        'You chose stability. But creativity finds its cracks — side projects, evenings, and weekends become a sacred space for expression without pressure.',
      emoji: '⏰',
      metric: 'Side project live',
    },
    {
      year: 3,
      title: 'Weekend Creator',
      description:
        'Your 9-5 funds the tools, classes, and freedom to create without financial panic. The work is slower — but more honest for it.',
      emoji: '🎭',
      metric: '8K side-audience',
    },
    {
      year: 5,
      title: 'Hybrid Life',
      description:
        "You've built something rare: financial security AND a genuine creative practice. The stability makes the art braver.",
      emoji: '⚖️',
      metric: 'Both worlds balanced',
    },
    {
      year: 10,
      title: 'Uncorrupted Work',
      description:
        'Without survival pressure, your creative work grew into something pure. No compromise for the market — only work you truly believe in.',
      emoji: '🌟',
      metric: 'Timeless body of work',
    },
  ],
  education: [
    {
      year: 1,
      title: 'Learning by Doing',
      description:
        'No tuition, just experience. You enter the workforce early and begin compounding practical knowledge from day one — and getting paid for it.',
      emoji: '⚙️',
      metric: '2 years exp ahead',
    },
    {
      year: 3,
      title: 'Self-Taught Edge',
      description:
        "You've learned more in 3 years of real work than most get in a classroom. And you got paid the entire time. The gap between you and peers widens.",
      emoji: '🛠️',
      metric: 'Senior-level role',
    },
    {
      year: 5,
      title: 'Practical Advantage',
      description:
        'While others graduated into debt, you have 5 years of savings, experience, and a track record. The gap reverses.',
      emoji: '📊',
      metric: 'Debt-free + $90K saved',
    },
    {
      year: 10,
      title: 'Proof Over Paper',
      description:
        "Your track record speaks louder than any credential. You lead teams, set strategy, and mentor people with degrees. Work is the ultimate credential.",
      emoji: '🔑',
      metric: 'Self-made authority',
    },
  ],
  relationship: [
    {
      year: 1,
      title: 'Time for Self',
      description:
        'You invest deeply in your own becoming — career, travel, deep friendships. You grow into someone extraordinary to know.',
      emoji: '🌿',
      metric: 'Thriving solo',
    },
    {
      year: 3,
      title: 'Freedom Compounds',
      description:
        "Your independence lets you take risks and pursue opportunities that partnered friends can't. Your life is entirely on your terms.",
      emoji: '🦅',
      metric: 'Fully autonomous',
    },
    {
      year: 5,
      title: 'New Connections',
      description:
        "When the right relationship does come, you bring your fullest, most complete self to it. No settling — only genuine alignment.",
      emoji: '💫',
      metric: 'Selectively open',
    },
    {
      year: 10,
      title: 'A Life Fully Lived',
      description:
        "Whether partnered or not, you built a rich, layered life. You chose growth over comfort every time — and it shows in everything you do.",
      emoji: '🌅',
      metric: 'Complete on your terms',
    },
  ],
  default: [
    {
      year: 1,
      title: 'The Alternative Path',
      description:
        'A different first year unfolds. You discover strengths and edges you never knew you had — the kind that only emerge under unfamiliar pressure.',
      emoji: '🌊',
      metric: 'New chapter begun',
    },
    {
      year: 3,
      title: 'Unexpected Growth',
      description:
        'This path forced you to evolve in ways the other one never would have. The person you are now is harder, wiser, and more interesting.',
      emoji: '🦋',
      metric: 'Transformed',
    },
    {
      year: 5,
      title: 'Hidden Rewards',
      description:
        "What seemed like the harder choice had gifts built into it that weren't visible from the starting line. Doors open that you didn't see before.",
      emoji: '🎁',
      metric: 'Exceeded expectations',
    },
    {
      year: 10,
      title: 'Your Parallel Life',
      description:
        'Ten years of small daily decisions compound into a life that is remarkably different — and remarkably good. Just in a way you never would have predicted.',
      emoji: '🌟',
      metric: 'Life richly lived',
    },
  ],
}

export function generateFutures(decision: string): GeneratedFutures {
  const { pathA, pathB } = parseDecision(decision)

  const typeA = detectPathType(pathA)
  const typeB = detectPathType(pathB)

  const milestonesA =
    typeA !== 'default' ? primaryMilestones[typeA] : alternativeMilestones[typeB] !== alternativeMilestones['default']
      ? primaryMilestones[typeA]
      : primaryMilestones['default']

  const milestonesB =
    typeB !== 'default'
      ? primaryMilestones[typeB]
      : typeA !== 'default'
        ? alternativeMilestones[typeA]
        : alternativeMilestones['default']

  return {
    futureA: {
      id: 'A',
      label: capitalize(pathA),
      theme: 'purple',
      tagline: `In this timeline, you chose to ${pathA.toLowerCase()}.`,
      milestones: milestonesA,
    },
    futureB: {
      id: 'B',
      label: capitalize(pathB),
      theme: 'cyan',
      tagline: `In this timeline, you chose to ${pathB.toLowerCase()}.`,
      milestones: milestonesB,
    },
  }
}
