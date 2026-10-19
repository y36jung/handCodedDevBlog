import SearchFilter from "./SearchFilter"
import TagFilter from "./TagFilter"
import DateFilter from "./DateFilter"


export default function BlogFilters() {
    return (
        <div
            style={
                {
                    border: '2px solid green',
                    height: '20%',
                    width: '95%',
                    flexDirection: 'column',
                    display: 'flex',
                }
            }
            className="blog-filters"
        >
            <SearchFilter/>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '2px solid brown',
                    height: '70%'
                }}
            >
                <TagFilter/>
                <DateFilter/>
            </div>
            
        </div>
    )
}