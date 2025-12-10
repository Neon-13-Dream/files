import { React } from "jimu-core"
import "./PageMove.css"

interface pageProps {
    value: number
    minPage: number
    maxPage: number
    onChange: (pageIndex: number) => void
    pageRadius: number
}

export default function PageMove(props: pageProps) {
    const [getCurrValue, setCurrValue] = React.useState<number | "">(props.value)

    // 🔥 СИНХРОНИЗАЦИЯ чтобы компонент не ломался
    React.useEffect(() => {
        setCurrValue(props.value)
    }, [props.value])

    function rangeArray(n: number): number[] {
        const result: number[] = []
        for (let i = -n; i <= n; i++) result.push(i)
        return result
    }

    function update(pageIndex: number) {
        const clampedValue = Math.max(props.minPage, Math.min(props.maxPage, pageIndex))
        setCurrValue(clampedValue)
        props.onChange(clampedValue)
    }

    return (
        <div className="pageArea">
            <div
                className={`pageBtn ${props.value <= props.minPage ? "diactiv" : "activ"}`}
                onClick={() => update(props.value - 1)}
            >
                {"<"}
            </div>

            {rangeArray(props.pageRadius).map((item, index) => {
                const pageNumber = props.value + item

                if (props.minPage <= pageNumber && pageNumber <= props.maxPage) {

                    // центральный элемент — input
                    if (item === 0) {
                        return (
                            <input
                                type="number"
                                key={index}
                                className="pageInput"
                                value={getCurrValue}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "") {
                                        setCurrValue("")
                                        return
                                    }
                                    const num = parseInt(val)
                                    if (!isNaN(num)) setCurrValue(num)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (getCurrValue === "") update(props.minPage)
                                        else update(Number(getCurrValue))
                                    }
                                }}
                            />
                        )
                    }

                    return (
                        <div
                            key={index}
                            className="pageBtn"
                            onClick={() => update(pageNumber)}
                        >
                            {pageNumber}
                        </div>
                    )
                }

                return (
                    <div className="pageBtn diactiv" key={index}>-</div>
                )
            })}

            <div
                className={`pageBtn ${props.value >= props.maxPage ? "diactiv" : "activ"}`}
                onClick={() => update(props.value + 1)}
            >
                {">"}
            </div>
        </div>
    )
}
