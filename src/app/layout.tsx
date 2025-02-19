import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "AIFlow",
  description:
    "An AI-powered interface that offers text summarization, translation, and language detection using Chrome's AI APIs.",
  icons: {
    icon: "/textai.svg",
    shortcut: "/textai.svg",
    apple: "/textai.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen transition-colors duration-500">
            <ClientLayout>{children}</ClientLayout>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
