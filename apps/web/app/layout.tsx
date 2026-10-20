// Perf tooling: react-scan must be the top-most import (dev only), WebVitals logs metrics to the console
import { ReactScan } from "./_components/react-scan";
import { WebVitals } from "./_components/web-vitals";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import DebugBorders from "./components/DebugBorders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html {...mantineHtmlProps} style={{
      display: 'flex',
      justifyContent: 'center',
      background: 'black',
      minHeight: '100vh',
    }}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body style={{
        display: 'flex',
        background: 'inherit',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2vh',
        margin: '2vh 2vw 2vh 2vw'
      }}>
        {process.env.NODE_ENV === "development" && <ReactScan />}
        <WebVitals />
        <MantineProvider defaultColorScheme="auto">
          <DebugBorders enabled={false}>
            {children}
          </DebugBorders>
        </MantineProvider>
      </body>
    </html>
  );
}
