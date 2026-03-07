import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Campaigns | OutreachX',
  description: 'Manage all your outreach campaigns',
}

export default function YourCampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
