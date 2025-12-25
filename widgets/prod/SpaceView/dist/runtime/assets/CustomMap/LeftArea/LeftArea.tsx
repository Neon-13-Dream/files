import { React } from "jimu-core"
import "./LeftArea.css"

import CloudIcon from "../../imgs/Cloud.png"
import AngleIcon from "../../imgs/Angle.png"

import {
    allThemes,
    FilterIcon,
    ZoomIcon,
    CheckIcon,
    DeleteIcon,
    LocationIcon,
    ImageIcon,
    translate
} from "../../../config"

import Popup from "../Popup/Popup"

const LeftAreaTypes = [
    "Hududlar",
    "Tasvirlar"
] as const
type LeftAreaType = typeof LeftAreaTypes[number];

interface leftAreaProps {
    geomList: any[],
    rasterList: any[],
    onChange: (type: string, index: any) => void
    getTheme: string
    getLang: string
    isReady: boolean
}

function LeftArea({
    geomList,
    rasterList,
    onChange,
    getTheme,
    getLang,
    isReady
}: leftAreaProps) {
    const [getAction, setAction] = React.useState<{ type: string, data: any, index: number }>({
        type: "none",
        data: "",
        index: -1
    })
    const [getSelectCount, setSelectCount] = React.useState({
        count: 0,
        select: 0
    })
    const [getType, setType] = React.useState<LeftAreaType>(LeftAreaTypes[0])
    const ListTitels: Record<LeftAreaType, string> = {
        "Hududlar": "Sizning hududlaringiz roʻyxati",
        "Tasvirlar": "Natijalar"
    }

    const popupType = (type: string, data: any, id: number, index?: number) => {
        switch (type) {
            case "info":
                if (data.OBJECTID !== getAction.index) {
                    onChange("rClicked", index)
                    setAction({ type: type, data: data, index: id })
                }
                else {
                    onChange("rClicked", -1)
                    setAction({ type: "none", data: "", index: -1 })
                }
                break;

            case "filter":
                if (type !== getAction.type) {
                    setAction({ type: type, data: "", index: -2 })
                }
                else {
                    setAction({ type: "none", data: "", index: -1 })
                }
                break;

            default:
                setAction({ type: "none", data: "", index: -1 })
                break;
        }
    }

    const ListContent = () => {
        switch (getType) {
            case "Hududlar": {
                if (geomList.length > 0) {
                    return (
                        geomList.map((item: any, index: number) => (
                            <div
                                className="LeftAreaListItem Hududlar"
                                onMouseEnter={() => onChange("gHover", index)}
                                onMouseLeave={() => onChange("gUnhover", -1)}
                            >
                                <div className="ItemTopContent">
                                    <div className={`ItemCheckBox ${item.visible ? 'activ' : ''}`} onClick={(e: any) => {
                                        e.stopPropagation()
                                        onChange("gToggel", index)
                                    }}>
                                        {item.visible && <CheckIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-activ-color"]})`} />}
                                    </div>
                                    <div className="ItemName">{item.name}</div>
                                </div>
                                <div className="ItemBottomContent">
                                    <div className="ItemInfo">{translate["Qamrov"][getLang]}: {item.area}km<sup>2</sup></div>
                                    <div className="ItemBtns">
                                        <div className="ItemBtn" onClick={() => { onChange("gZoom", index) }}><ZoomIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                                        <div className="ItemBtn" onClick={() => { onChange("gDelete", index) }}><DeleteIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                }

                return (
                    <div className="EmptyArea">
                        <div className="EmptyIcon"><LocationIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                        <div className="EmptyDesc">{translate["Mavjud tasvirlarni ko‘rish uchun iltimos, hudud qo‘shing"][getLang]}</div>
                    </div>
                )
            }

            case "Tasvirlar": {
                if (!isReady) {
                    return (
                        <div className="loader-container">
                            <div className="loader">
                                {/* Центральный неподвижный элемент */}
                                <div className="center-item">
                                    {/* Здесь будет твоё центральное изображение */}
                                    <div className="placeholder center-placeholder" />
                                </div>

                                {/* Вращающийся элемент вокруг центра */}
                                <div className="orbit">
                                    <div className="orbit-item">
                                        {/* Здесь будет твоё вращающееся изображение */}
                                        <div className="placeholder orbit-placeholder" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
                if (rasterList.length === 0) {
                    return (
                        <div className="EmptyArea">
                            <div className="EmptyIcon"><ImageIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                            <div className="EmptyDesc">{translate["Kunlik tasvirlar katalogini ko‘rish mumkin bo‘lgan joyni toping"][getLang]}</div>
                        </div>
                    )
                }
                return (
                    rasterList.map((item: any, index: number) => (
                        <div className={`LeftAreaListItem Tasvirlar ${item.attributes.OBJECTID === getAction.index ? 'activ' : ''}`}
                            onMouseEnter={() => onChange("rHover", index)}
                            onMouseLeave={() => onChange("rUnhover", index)}

                            onClick={() => {
                                popupType("info", item.attributes, item.id, index)
                            }}
                        >
                            <div className="ItemIcon">
                                <img src={item.thumbnail} />
                                <div className={`ItemCheckBox ${item.visible ? 'activ' : ''}`} onClick={(event: any) => {
                                    event.stopPropagation();
                                    onChange("rToggel", index);
                                }}>
                                    {item.visible && <CheckIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-activ-color"]})`} />}
                                </div>
                            </div>
                            <div className="ItemRightContent">
                                <div className="ItemName">{translate["Tasvir ID"][getLang]}: {item.attributes.Catalog_ID}</div>
                                <div className="ItemName">
                                    {item.attributes.Sana ? new Date(item.attributes.Sana).toLocaleDateString('ru-RU') : ''}
                                </div>
                                <div className="ItemRightInfo">
                                    <div className="InfoArea">
                                        <img src={CloudIcon} />{item.attributes.Bulut_qop}%
                                    </div>
                                    <div className="InfoArea">
                                        <img src={AngleIcon} />{item.attributes.Ogish_bur}°
                                    </div>
                                    <div className="InfoArea">
                                        <img src={AngleIcon} />{item.attributes.Sensor}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )
            }
        }
    }

    React.useEffect(() => {
        if (getType === "Hududlar") {
            setSelectCount({
                count: geomList.length,
                select: geomList.filter((item: any) => item.visible).length
            })
        }
        else if (getType === "Tasvirlar") {
            setSelectCount({
                count: rasterList.length,
                select: rasterList.filter((item: any) => item.visible).length
            })
        }
    }, [getType, geomList, rasterList, isReady])

    // <AreaIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <CheckIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <CircleIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <DeleteIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <FilterIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LanguageIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LayersIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <MinusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <PlusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <PolygonIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ReactangleIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <RulerIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ThemeIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ZoomIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <SearchIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LocationIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ImageIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LogoIcon size="100px" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />

    return (
        <div className="LeftArea">
            <div className="LeftAreaHeader">
                <div className="LeaftAreaTypes">
                    {LeftAreaTypes.map((item: LeftAreaType) => (
                        <div className={`LeaftAreaType ${getType === item ? 'activ' : ''}`} onClick={() => { setType(item) }}>{translate[item][getLang]}</div>
                    ))}
                </div>
                <div className="HeaderBtn" onClick={() => { popupType("filter", "", -2) }}>
                    <FilterIcon size="70%" color={`rgb(${allThemes[getTheme][getAction.type === "filter" ? '--main-activ-color' : "--main-second-color-rgb"]})`} />
                </div>
            </div>
            <div className="LeftAreaListInfo">
                <div className="ListAreaTitle">{translate[ListTitels[getType]][getLang]}</div>
                <div className="ListAreaContent" style={{ display: getSelectCount.count > 0 ? "flex" : "none" }}>
                    <div className="ContentSelected">{translate["Tanlangan"][getLang]}: {getSelectCount.select}/{getSelectCount.count}</div>
                    <div className="ContentBtns">
                        <div
                            className={`ContentBtn ${getSelectCount.select > 0 ? 'activ' : ''}`}
                            onClick={() => {
                                if (getSelectCount.select > 0) {
                                    if (getType === "Hududlar") onChange("gHideAll", -1)
                                    if (getType === "Tasvirlar") onChange("rHideAll", -1)
                                }
                            }}
                        >
                            {translate["Bekor qilish"][getLang]}
                        </div>
                        <div
                            className={`ContentBtn ${getSelectCount.select < getSelectCount.count ? 'activ' : ''}`}
                            onClick={() => {
                                if (getSelectCount.select < getSelectCount.count) {
                                    if (getType === "Hududlar") onChange("gShowAll", -1)
                                    if (getType === "Tasvirlar") onChange("rShowAll", -1)
                                }
                            }}
                        >
                            {translate["Barchasini belgilash"][getLang]}
                        </div>
                    </div>
                </div>
            </div>
            <div className="LeftAreaList">{ListContent()}</div>

            <Popup
                actiom={getAction}
                onChange={(value: string) => { onChange("where", value) }}
                getTheme={getTheme}
                getLang={getLang}
            />
        </div>
    )
}

export default React.memo(LeftArea)