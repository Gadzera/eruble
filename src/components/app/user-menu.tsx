"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Shield, KeyRound, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileSheet } from "./profile-sheet";
import { ApiKeysSheet } from "./api-keys-sheet";
import { logout } from "@/app/actions";

const initials = (name: string) =>
  name.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

type OrgUser = { id: string; name: string; role: string; email: string };

export function UserMenu({
  name, email, role, userId, orgName, orgInn, bankName, orgUsers,
}: {
  name: string;
  email: string;
  role: string;
  userId: string;
  orgName: string;
  orgInn: string;
  bankName: string;
  orgUsers: OrgUser[];
}) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  function handleLogout() {
    startLogout(() => logout());
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-xs text-muted-foreground font-normal">{email}</span>
              <span className="text-[10px] text-primary/80 mt-1 uppercase tracking-wider font-semibold">{role}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
            <Shield className="h-4 w-4 mr-2" /> Профиль и безопасность
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setApiKeysOpen(true)}>
            <KeyRound className="h-4 w-4 mr-2" /> API-ключи
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/settings")}>
            <Settings className="h-4 w-4 mr-2" /> Настройки
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <LogOut className="h-4 w-4 mr-2" />}
            {loggingOut ? "Выход..." : "Выйти"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{ id: userId, name, email, role, orgName, orgInn, bankName }}
        orgUsers={orgUsers}
      />
      <ApiKeysSheet
        open={apiKeysOpen}
        onClose={() => setApiKeysOpen(false)}
      />
    </>
  );
}
