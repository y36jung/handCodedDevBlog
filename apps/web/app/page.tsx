import { Suspense } from "react";
import { Text } from "@mantine/core";
import BlogFilters from "./components/BlogFilters";
import BlogList from "./components/BlogList";

export default function Home() {
  return (
    <>
      <div style={
          {
            width: '95%'
          }
        }
        className="devblog-title"
      >
        <Text size="sm" fw={500} mb={4}>devlog</Text>
        <Text size="sm" c="dimmed">building memory bank, one wrong turn at a time</Text>
      </div>
      <Suspense>
        <BlogFilters></BlogFilters>
        <BlogList></BlogList>
      </Suspense>
    </>
  );
}
