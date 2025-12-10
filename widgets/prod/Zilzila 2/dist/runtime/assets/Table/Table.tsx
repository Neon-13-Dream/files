import { React } from "jimu-core"
import {
    type tableConf,
    defaultTableConf,
    idConf
} from "../../config"
import "./Table.css"

export interface tableProps {
    data: any
    page: number
    per_page: number
    activeIndex: number       // <-- добавлено
    onChange: (index: number) => void
}

export default function MyTable(props: tableProps) {
    const withIndex = true

    const valueFilter = (fieldName: string, value: any) => {
        switch (fieldName) {
            case "magnitude":
                return Math.floor(value * 10) / 10
            case "longitude":
            case "latitude":
                return Math.floor(value * 100) / 100
            case "time":
                return value.split('.')[0]
            default:
                return value
        }
    }

    return (
        <div className="tableArea">
            {/* ---- Заголовки ---- */}
            <div className="tableFieldsArea">
                {withIndex && (
                    <div className="tableField" style={{ width: idConf.width }}>
                        {idConf.name}
                    </div>
                )}

                {(Object.keys(defaultTableConf) as Array<keyof tableConf>).map((field) => (
                    <div
                        key={field}
                        className="tableField"
                        style={{ width: defaultTableConf[field].width }}
                    >
                        {defaultTableConf[field].name}
                    </div>
                ))}
            </div>

            {/* ---- Строки ---- */}
            <div className="tableValuesArea">
                {props.data.map((row: any, index: number) => {
                    const isActive = index === props.activeIndex

                    return (
                        <div
                            key={index}
                            className={`tableRow ${isActive ? "activ" : ""}`}
                            onClick={() =>
                                props.onChange(isActive ? -1 : index)
                            }
                        >
                            {withIndex && (
                                <div
                                    className="tableValue"
                                    style={{ width: idConf.width }}
                                >
                                    {1 + index + props.page * props.per_page}
                                </div>
                            )}

                            {(Object.keys(defaultTableConf) as Array<keyof tableConf>).map((field) => (
                                <div
                                    key={field}
                                    className="tableValue"
                                    style={{
                                        width: defaultTableConf[field].width,
                                        userSelect: defaultTableConf[field].uSelect
                                    }}
                                    title={field === "epicenter" ? row.description : ""}
                                >
                                    {valueFilter(field, row[field])}
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
