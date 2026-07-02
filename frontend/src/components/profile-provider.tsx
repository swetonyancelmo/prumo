"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserProfile } from "@/lib/types";

const ProfileContext = createContext<UserProfile | null>(null);

export function ProfileProvider({
  value,
  children,
}: {
  value: UserProfile;
  children: ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): UserProfile {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile deve ser usado dentro de <ProfileProvider>.");
  }
  return ctx;
}
