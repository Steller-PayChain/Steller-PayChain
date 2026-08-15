'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WalletButton } from '@/components/wallet/wallet-button'
import { useAuthStore } from '@/store/auth'

export function Topbar() {
  const { user } = useAuthStore()

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shrink-0">
      <div>
        <p className="text-sm text-muted-foreground">
          {user?.company?.name ?? 'Your Company'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <WalletButton />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
