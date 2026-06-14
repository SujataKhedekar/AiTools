import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  authors: [{ name: "codepalette" }],
  creator: "codepalette",
  publisher: "codepalette",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.brand,
    url: SITE.url,
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: "codepalette",
      url: SITE.url,
    },
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: `${TOOLS.length} AI tools across 8 categories`,
  };

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <JsonLd data={websiteLd} />
        <JsonLd data={appLd} />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
