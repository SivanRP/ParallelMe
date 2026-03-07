import { SimulateClient } from './SimulateClient'

interface PageProps {
  searchParams: { decision?: string }
}

export default function SimulatePage({ searchParams }: PageProps) {
  const decision = searchParams.decision ?? ''
  return <SimulateClient decision={decision} />
}
