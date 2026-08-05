"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiXOctagon, FiLoader } from "react-icons/fi"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: (
          <FiCheckCircle className="size-4" />
        ),
        info: (
          <FiInfo className="size-4" />
        ),
        warning: (
          <FiAlertTriangle className="size-4" />
        ),
        error: (
          <FiXOctagon className="size-4" />
        ),
        loading: (
          <FiLoader className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          closeButton: "!absolute !right-2 !top-2 !left-auto !translate-x-0 !translate-y-0 !border-none !bg-transparent !text-slate-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
