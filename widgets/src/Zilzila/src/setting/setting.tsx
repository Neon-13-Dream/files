/** @jsx jsx */
import {
    React, jsx, Immutable,
    DataSourceTypes, DataSourceManager
} from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { ColorPicker } from 'jimu-ui/basic/color-picker'
import './settingStyle.css'

export default function Setting(props: AllWidgetSettingProps<any>) {
    const [fields, setFields] = React.useState<any[]>([])
    const [modalWindow, toggelModal] = React.useState(null)
    const posState = ["left", "center", "right"]
    const url = "https://api.smrm.uz/api/earthquakes" // ?sort=datetime_desc&epicenter=&from_date=&to_date=&from_magnitude=&to_magnitude=&from_depth=&to_depth=&from_latitude=&to_latitude=&from_longitude=&to_longitude=&uzb=0&per_page=10&page=2
    const filter = React.useRef({
        sort: "datetime_desc",  //   sort           = datetime_desc &
        epicenter: "",          //   epicenter      = &
        from_date: "",          //   from_date      = &
        to_date: "",            //   to_date        = &
        from_magnitude: "",     //   from_magnitude = &
        to_magnitude: "",       //   to_magnitude   = &
        from_depth: "",         //   from_depth     = &
        to_depth: "",           //   to_depth       = &
        from_latitude: "",      //   from_latitude  = &
        to_latitude: "",        //   to_latitude    = &
        from_longitude: "",     //   from_longitude = &
        to_longitude: "",       //   to_longitude   = &
        uzb: 1,                 //   uzb            = 0 &
        per_page: 1,            //   per_page       = 10 &
        page: 1,                //   page           = 2
    })

    React.useEffect(() => {
        if (props.config.fields && props.config.fields.length > 0) {
            setFields(props.config.fields)
        }
    }, [props.config.fields])

    React.useEffect(() => {
        if (!props.config.fields) {
            var fieldsObj: any[] = []
            fetch(`${url}?${Object.entries(filter.current).map(([key, value]) => `${key}=${value}`).join("&")}`)
                .then((result: any) => result.json())
                .then((data: any) => {
                    Object.keys(data.result.data[0]).forEach((item: any, index: number) => {
                        fieldsObj.push({
                            posIndex: index,

                            name: item,
                            title: item,
                            use: true,
                            size: "100",

                            fieldColor: "#ffffff",
                            fieldFill: "#7382f8",
                            fieldPos: "center",

                            valueColorOdd: "#001cff",
                            valueFillOdd: "#ffffff",
                            valueColorEven: "#001cff",
                            valueFillEven: "#ffffff",
                            valuePos: "center",

                            separateFill: true,
                            separateColor: true
                        })
                    })

                    setFields(fieldsObj)
                    console.log(fieldsObj)

                    props.onSettingChange({
                        id: props.id,
                        config: {
                            ...props.config,
                            fields: fieldsObj
                        }
                    })
                })
        }
    }, [props.config.fields])

    const moveItem = (index: number, newPos: number) => {
        const updated = [...fields]

        if (newPos < 0) newPos = 0
        if (newPos >= updated.length) newPos = updated.length - 1

        const item = updated.splice(index, 1)[0]

        updated.splice(newPos, 0, item)

        updated.forEach((f, i) => {
            f.posIndex = i
        })

        setFields(updated)

        props.onSettingChange({
            id: props.id,
            config: {
                ...props.config,
                fields: updated
            }
        })
    }

    const onEnter = (e: any, index: number) => {
        if (e.key === 'Enter') {
            const newPos = parseInt(e.target.value)
            if (!isNaN(newPos)) moveItem(index, newPos)
        }
    }

    const handlePosChange = (e: any, index: number) => {
        const updated = [...fields]
        updated[index].posIndex = Number(e.target.value)
        setFields(updated)
    }

    const updateData = (newValue: any, fieldName: any, index: number) => {
        const updated = [...fields]

        const names = Array.isArray(fieldName) ? fieldName : [fieldName]
        const values = Array.isArray(newValue) ? newValue : [newValue]

        names.forEach((name, i) => {
            updated[index] = {
                ...updated[index],
                [name]: values[i]
            }
        })

        setFields(updated)

        props.onSettingChange({
            id: props.id,
            config: {
                ...props.config,
                fields: updated
            }
        })
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: "15px",
            gap: '10px'
        }}>
            {(
                fields.map((item: any, index: number) => (
                    <div>
                        <div key={index} className='itemList'>
                            <input
                                type="number"
                                value={item.posIndex}
                                onChange={(e) => handlePosChange(e, index)}
                                onKeyDown={(e) => onEnter(e, index)}
                                className='infoBlock1-widthInput'
                            />
                            <div>{item.name}</div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: "5px"
                            }}>
                                <div
                                    className={item.use ? 'checkBox checked' : 'checkBox'}
                                    onClick={() => {
                                        updateData(!fields[index].use, "use", index)
                                    }}
                                ></div>

                                <div
                                    className="settingsBtn"
                                    onClick={() => toggelModal(fields[index])}
                                >
                                    ⚙️
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {modalWindow && (
                <div className="modalArea">
                    <div className='mainArea'>
                        <div className='mainAreaTitle'>
                            Additional settings
                        </div>

                        <div className='infoBlock1'>
                            <div className='infoBlock1-fieldname'>
                                Field name: <strong>{fields[modalWindow.posIndex].name}</strong>
                            </div>
                            <div className='infoBlock1-widthSetting'>
                                Width:
                                <input
                                    type="number"
                                    value={fields[modalWindow.posIndex].size}
                                    onChange={(e) => updateData(e.target.value, "size", modalWindow.posIndex)}
                                    className='infoBlock1-widthInput'
                                />
                                <div className={'customCheckBox' + (fields[modalWindow.posIndex].separateFill ? ' checked' : '')}
                                    title="Separate ?"
                                >
                                    <span></span>
                                </div>
                            </div>
                            <div className='infoBlock1-fieldname'>
                                Sort: <strong>ASC</strong>
                            </div>
                        </div>

                        <div className='infoBlock2'>
                            Other name:
                            <input
                                type="text"
                                value={fields[modalWindow.posIndex].title}
                                onChange={(e) => updateData(e.target.value, "title", modalWindow.posIndex)}
                                className='infoBlock2-titleInput'
                            />
                        </div>

                        <div className='styleBlockArea'>
                            <div className='styleBlock'>
                                <div className='styleSetting1'>
                                    <div className='styleBlockTitle'>Field styles</div>
                                    <div className='styleBlockWrap'>
                                        Text wrap:
                                        <div className={'customCheckBox' + (fields[modalWindow.posIndex].separateFill ? ' checked' : '')}
                                            title="Separate ?"
                                        >
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className='styleSetting2'>
                                    {posState.map((item: string) => (
                                        <div className={item == fields[modalWindow.posIndex].fieldPos ? 'activ' : ''} onClick={() => updateData(item, 'fieldPos', modalWindow.posIndex)}>{item}</div>
                                    ))}
                                </div>
                                <div className='styleSetting3'>
                                    <div className='colorList'>
                                        <div>
                                            Color:
                                        </div>
                                        <ColorPicker
                                            className="myColorPicker"
                                            color={fields[modalWindow.posIndex].fieldColor}
                                            placement="left"
                                            popperProps={{
                                                strategy: 'fixed',
                                                modifiers: [{ name: 'hide', enabled: false }]
                                            }}
                                            onChange={(color: any) => {
                                                updateData(color, 'fieldColor', modalWindow.posIndex)
                                            }}
                                            style={{
                                                background: fields[modalWindow.posIndex].fieldColor
                                            }}
                                        />
                                    </div>
                                    <div className='colorList'>
                                        <div>
                                            Fill:
                                        </div>
                                        <ColorPicker
                                            className="myColorPicker"
                                            color={fields[modalWindow.posIndex].fieldFill}
                                            placement="left"
                                            popperProps={{
                                                strategy: 'fixed',
                                                modifiers: [{ name: 'hide', enabled: false }]
                                            }}
                                            onChange={(color: any) => {
                                                updateData(color, 'fieldFill', modalWindow.posIndex)
                                            }}
                                            style={{
                                                background: fields[modalWindow.posIndex].fieldFill
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='styleBlock'>
                                <div className='styleSetting1'>
                                    <div className='styleBlockTitle'>Value styles</div>
                                    <div className='styleBlockWrap'>
                                        Text wrap:
                                        <div className={'customCheckBox' + (fields[modalWindow.posIndex].separateFill ? ' checked' : '')}
                                            title="Separate ?"
                                        >
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className='styleSetting2'>
                                    {posState.map((item: string) => (
                                        <div className={item == fields[modalWindow.posIndex].valuePos ? 'activ' : ''} onClick={() => updateData(item, 'valuePos', modalWindow.posIndex)}>{item}</div>
                                    ))}
                                </div>
                                <div className='styleSetting3'>
                                    <div className='colorList'>
                                        <div>
                                            Color:
                                        </div>
                                        <div className='colorListItems'>
                                            <ColorPicker
                                                className="myColorPicker2"
                                                color={fields[modalWindow.posIndex].valueColorOdd}
                                                placement="right"
                                                popperProps={{
                                                    strategy: 'fixed',
                                                    modifiers: [{ name: 'hide', enabled: false }]
                                                }}
                                                onChange={(color: any) => {
                                                    updateData([color, color], ['valueColorOdd', 'valueColorEven'], modalWindow.posIndex)
                                                }}
                                                style={{
                                                    background: fields[modalWindow.posIndex].valueColorOdd,
                                                    "--custim-color": "#f00"
                                                }}
                                            />
                                            <div className={'customCheckBox' + (fields[modalWindow.posIndex].separateColor ? ' checked' : '')}
                                                title="Separate ?"
                                                onClick={() => {
                                                    updateData([!fields[modalWindow.posIndex].separateColor, fields[modalWindow.posIndex].valueColorOdd], ['separateColor', 'valueColorEven'], modalWindow.posIndex)
                                                }}
                                            >
                                                <span></span>
                                            </div>
                                            <ColorPicker
                                                className="myColorPicker2"
                                                color={fields[modalWindow.posIndex].valueColorEven}
                                                placement="right"
                                                popperProps={{
                                                    strategy: 'fixed',
                                                    modifiers: [{ name: 'hide', enabled: false }]
                                                }}
                                                onChange={(color: any) => {
                                                    updateData(color, 'valueColorEven', modalWindow.posIndex)
                                                }}
                                                style={{
                                                    background: fields[modalWindow.posIndex].valueColorEven,
                                                    "--custim-color": "#00f"
                                                }}
                                                disabled={fields[modalWindow.posIndex].separateColor}
                                            />
                                        </div>
                                    </div>
                                    <div className='colorList'>
                                        <div>
                                            Fill:
                                        </div>
                                        <div className='colorListItems'>
                                            <ColorPicker
                                                className="myColorPicker2"
                                                color={fields[modalWindow.posIndex].valueFillOdd}
                                                placement="right"
                                                popperProps={{
                                                    strategy: 'fixed',
                                                    modifiers: [{ name: 'hide', enabled: false }]
                                                }}
                                                onChange={(color: any) => {
                                                    updateData([color, color], ['valueFillOdd', 'valueFillEven'], modalWindow.posIndex)
                                                }}
                                                style={{
                                                    background: fields[modalWindow.posIndex].valueFillOdd,
                                                    "--custim-color": "#f00"
                                                }}
                                            />
                                            <div className={'customCheckBox' + (fields[modalWindow.posIndex].separateFill ? ' checked' : '')}
                                                title="Separate ?"
                                                onClick={() => {
                                                    updateData([!fields[modalWindow.posIndex].separateFill, fields[modalWindow.posIndex].valueFillOdd], ['separateFill', 'valueFillEven'], modalWindow.posIndex)
                                                }}
                                            >
                                                <span></span>
                                            </div>
                                            <ColorPicker
                                                className="myColorPicker2"
                                                color={fields[modalWindow.posIndex].valueFillEven}
                                                placement="right"
                                                popperProps={{
                                                    strategy: 'fixed',
                                                    modifiers: [{ name: 'hide', enabled: false }]
                                                }}
                                                onChange={(color: any) => {
                                                    updateData(color, 'valueFillEven', modalWindow.posIndex)
                                                }}
                                                style={{
                                                    background: fields[modalWindow.posIndex].valueFillEven,
                                                    "--custim-color": "#00f"
                                                }}
                                                disabled={fields[modalWindow.posIndex].separateFill}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='buttons'>
                            <div className='buttonClose'
                                onClick={() => {
                                    const updated = [...fields]
                                    updated[modalWindow.posIndex] = modalWindow
                                    setFields(updated)
                                    props.onSettingChange({
                                        id: props.id,
                                        config: {
                                            ...props.config,
                                            fields: updated
                                        }
                                    })
                                    toggelModal(null)
                                }}
                            >
                                Close
                            </div>
                            <div className='buttonSave'
                                onClick={() => toggelModal(null)}
                            >
                                Save
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}