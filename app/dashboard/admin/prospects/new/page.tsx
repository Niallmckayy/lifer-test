import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import NewProspectForm from './NewProspectForm'

export default async function NewProspectPage() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  return <NewProspectForm />
}
