import { MantineProvider } from "@mantine/core";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html style={{
      display: 'flex',
      justifyContent: 'center',
      background: 'black',
      border: '1px solid red',
      minHeight: '100vh',
    }}>
      <body style={{
        border: '1px solid pink',
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2%',
        margin: '2% 2% 2% 2%'
      }}>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
