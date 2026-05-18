'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Landing, { AuthModal } from '@/components/landing'

export default function HomePage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signup')

  return (
    <>
      <Landing
        onStart={() => { setAuthMode('signup'); setAuthOpen(true) }}
        onSignIn={() => { setAuthMode('signin'); setAuthOpen(true) }}
      ></Landing>

      <AuthModal
        open={authOpen}
        defaultMode={authMode}
        supabase={supabase}
        onClose={() => setAuthOpen(false)}
        onAuth={() => { setAuthOpen(false); router.push('/app') }}
      ></AuthModal>
    </>
  )
}
