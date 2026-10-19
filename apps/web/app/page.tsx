import BlogFilters from "./components/BlogFilters";
import BlogList from "./components/BlogList";

export default function Home() {
  return (
    <>
      <div style={
          {
            border: '2px solid blue',
            height: '10%',
            width: '95%'
          }
        }
        className="devblog-title"
      >

      </div>
      <BlogFilters></BlogFilters>
      <BlogList></BlogList>
    </>
  );
}
