import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "ReplyLink — Turn comments into customers",
 description: "Automate Instagram and Facebook comment-to-DM campaigns with ReplyLink.",
 metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
 openGraph: { title: "ReplyLink", description: "Turn every comment into a customer.", type: "website" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
