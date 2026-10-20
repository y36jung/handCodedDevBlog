import { render } from "@testing-library/react"
import { MantineProvider } from "@mantine/core"

// env="test" turns off Mantine transitions and portals so popovers render synchronously
export function renderWithMantine(ui: React.ReactElement) {
    return render(<MantineProvider env="test">{ui}</MantineProvider>)
}
