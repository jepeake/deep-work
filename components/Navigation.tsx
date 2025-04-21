"use client";

import React from "react";
import { User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const { status } = useSession();
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/signin' });
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white">
      <div className="container mx-auto">
        <div className="flex items-center justify-end p-3">
          {status === "authenticated" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleSignOut}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center px-3 py-1 rounded-full border border-black/10 bg-black/5 text-xs">
                <User className="h-3 w-3 text-black/70" />
              </div>
              <LogOut className="h-3.5 w-3.5 text-black/50 hover:text-black transition-colors" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 