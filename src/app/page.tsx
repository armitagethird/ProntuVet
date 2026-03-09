import { redirect } from 'next/navigation'

export default function Home() {
  // Directly redirect to dashboard (middleware will handle auth state and redirect to login if needed)
  redirect('/dashboard')
}
