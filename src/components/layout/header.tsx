"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "用户";
  const userEmail = session?.user?.email ?? "";
  const userImage = session?.user?.image;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors outline-none">
          <span className="text-sm text-gray-600">{userName}</span>
          <Avatar className="h-8 w-8">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => window.location.href = "/settings"}
          >
            <User className="h-4 w-4 mr-2" />
            个人设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
