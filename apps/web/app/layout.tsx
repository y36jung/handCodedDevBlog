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
        <MantineProvider defaultColorScheme="auto">
          <DebugBorders enabled={false}>
            {children}
          </DebugBorders>
        </MantineProvider>
      </body>
    </html>
  );
}
