import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/blocked-dates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/blocked-dates"!</div>
}
