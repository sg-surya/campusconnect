import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "CampusConnect | Verified College Networking",
  description:
    "The first platform where verified students randomly connect, network, and collaborate — safely, anonymously, and meaningfully.",
  keywords: [
    "college chat",
    "random chat",
    "student networking",
    "campus connect",
    "study partner",
    "verified students",
  ],
  openGraph: {
    title: "CampusConnect | Verified College Networking",
    description:
      "Connect with verified college students. Random chat, study partners, project teammates, and co-founders.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
