import Image from "next/image";
import BlogFilters from "./components/BlogFilters";
import BlogList from "./components/BlogList";

export default function Home() {
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
        gap: '2%'
      }}>
        <div style={
            {
              border: '2px solid blue',
              height: '10vh',
              width: '90vw'
            }
          }
          className="devblog-title"
        >
          
        </div>
        <BlogFilters></BlogFilters>
        <BlogList></BlogList>
      </body>
    </html>
  );
}
