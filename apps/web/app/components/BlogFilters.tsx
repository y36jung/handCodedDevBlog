'use client'

import SearchFilter from "./SearchFilter"
import TagFilter from "./TagFilter"
import DateFilter from "./DateFilter"
import FilterChips from "./FilterChips"


export default function BlogFilters() {
    return (
        <div
            style={
                {
                    width: '95%',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: 10
                }
            }
            className="blog-filters"
        >
            <SearchFilter/>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: '70%'
                }}
            >
                <TagFilter/>
                <DateFilter/>
            </div>

            <FilterChips/>

        </div>
    )
}
