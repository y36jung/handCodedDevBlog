'use client'

import dayjs from "dayjs"
import { Button, Group, Popover, Stack, Text } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import useBlogFilters from "../lib/useBlogFilters"

const PRESETS = [
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last year', days: 365 },
]

export default function DateFilter() {
    const { from, to, setRange } = useBlogFilters()
    const isSet = Boolean(from || to)

    function applyPreset(days: number) {
        const today = dayjs()
        setRange(today.subtract(days, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD'))
    }

    return (
        <div
        style={
            {
                minHeight: '30%'
            }
        }
        >
            <Popover width={300} position="bottom-start" shadow="md">
                <Popover.Target>
                    <Button
                        variant={isSet ? 'light' : 'default'}
                        size="xs"
                        rightSection={<Text span size="9px" c="dimmed">▼</Text>}
                    >
                        Date{isSet ? ' · set' : ''}
                    </Button>
                </Popover.Target>
                <Popover.Dropdown p={12}>
                    <Stack gap={10}>
                        {/* Nested date pickers render inline so clicking them doesn't close this popover */}
                        <DateInput
                            size="xs"
                            label="From"
                            placeholder="Any"
                            valueFormat="YYYY-MM-DD"
                            clearable
                            value={from || null}
                            maxDate={to || undefined}
                            onChange={(v) => setRange(v ?? '', to)}
                            popoverProps={{ withinPortal: false }}
                        />
                        <DateInput
                            size="xs"
                            label="To"
                            placeholder="Any"
                            valueFormat="YYYY-MM-DD"
                            clearable
                            value={to || null}
                            minDate={from || undefined}
                            onChange={(v) => setRange(from, v ?? '')}
                            popoverProps={{ withinPortal: false }}
                        />
                        <Group gap={6}>
                            {PRESETS.map(({ label, days }) => (
                                <Button key={days} variant="default" size="compact-xs" onClick={() => applyPreset(days)}>
                                    {label}
                                </Button>
                            ))}
                        </Group>
                    </Stack>
                </Popover.Dropdown>
            </Popover>
        </div>
    )
}
