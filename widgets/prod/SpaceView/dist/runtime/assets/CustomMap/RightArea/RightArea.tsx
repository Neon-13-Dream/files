import { React } from "jimu-core"
import type MapView from "@arcgis/core/views/MapView"
import "./RightArea.css"

import Streets from "../../imgs/Streets_Night.jpg"
import Dark from "../../imgs/Dark_Gray_Canvas.jpg"
import Hybrid from "../../imgs/Hybrid.jpg"
import Topographic from "../../imgs/Topographic.jpg"

import {
    allThemes,
    AreaIcon,
    CheckIcon,
    CircleIcon,
    LayersIcon,
    MinusIcon,
    PlusIcon,
    PolygonIcon,
    ReactangleIcon,
    RulerIcon,
    ImportIcon,
    translate
} from "../../../config"

interface rightAreaProps {
    map: MapView
    onChange: (type: string) => void
    overlayMap: any,
    getTheme: string,
    getLang: string
}

const baseMaps = {
    vector: [
        {
            baseName: "streets-night-vector",
            title: "Streets (Night)",
            url: Streets,
        },
        {
            baseName: "dark-gray-vector",
            title: "Dark Gray Canvas",
            url: Dark
        },
    ],
    raster: [
        {
            baseName: "satellite",
            title: "Satellite",
            url: Hybrid
        },
        {
            baseName: "hybrid",
            title: "Hybrid",
            url: Hybrid
        },
        {
            baseName: "topo",
            title: "Topographic",
            url: Topographic,
        },
    ]
}

export default function RightArea({ map, onChange, overlayMap, getTheme, getLang }: rightAreaProps) {
    const [getType, setType] = React.useState("none")
    const [showBasemaps, setShowBasemaps] = React.useState(false)
    const [showBasemap, setShowBasemap] = React.useState<boolean>(false)

    if (!map) return null

    const zoomIn = () => {
        map.goTo({ zoom: Math.min(map.zoom + 1, 20) }, { duration: 500 })
    }

    const zoomOut = () => {
        map.goTo({ zoom: Math.max(map.zoom - 1, 1) }, { duration: 500 })
    }

    const changeBasemap = (id: string) => {
        map.map.basemap = id
        setShowBasemaps(false)
    }

    const updateType = (type: string) => {
        if (type === "Import") {
            onChange("Import")
            return
        }

        if (type === getType) {
            onChange("none")
            setType("none")
        }
        else {
            onChange(type)
            setType(type)
        }
    }

    return (
        <div className="RightArea">
            <div className="RightBtnArea layers-wrapper">
                {showBasemaps && (
                    <div className="BasemapPopup">
                        <div className="BasemapHeader">
                            {translate["Asosiy xaritalar"][getLang]}
                        </div>

                        <div className="BasemapGroup">
                            <div className="BasemapGroupTitle">
                                {translate["Vektor"][getLang]}
                            </div>
                            {baseMaps.vector.map(bm => (
                                <div
                                    key={bm.baseName}
                                    className={`BasemapItem ${map.map.basemap?.id === bm.baseName ? "active" : ""}`}
                                    onClick={() => changeBasemap(bm.baseName)}
                                >
                                    {bm.title}
                                    <div className="BasemapImg">
                                        <img src={bm.url} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="BasemapGroup">
                            <div className="BasemapGroupTitle">
                                {translate["Raster"][getLang]}
                            </div>
                            {baseMaps.raster.map(bm => (
                                <div
                                    key={bm.baseName}
                                    className={`BasemapItem ${map.map.basemap?.id === bm.baseName ? "active" : ""}`}
                                    onClick={() => changeBasemap(bm.baseName)}
                                >
                                    {bm.title}
                                    <div className="BasemapImg">
                                        <img src={bm.url} />
                                    </div>
                                </div>
                            ))}
                            <div className={`BasemapItem`} onClick={() => {
                                setShowBasemap(!showBasemap)
                                overlayMap.visible = !showBasemap
                            }}>
                                {translate["Kartografik asos"][getLang]}
                                <div className={`ItemCheckBox ${showBasemap ? 'activ' : ''}`}>{showBasemap && <CheckIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />}</div>
                            </div>
                        </div >
                    </div>
                )}

                <div
                    className="RightAreaBtn"
                    onClick={() => setShowBasemaps((v: any) => !v)}
                >
                    <LayersIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                </div>
            </div>

            <div className="RightBtnArea">
                <div className={`RightAreaBtn`} onClick={() => updateType("line")}><RulerIcon size="40%" color={`rgb(${allThemes[getTheme][getType === "line" ? "--main-activ-color" : "--main-second-color-rgb"]})`} /></div>
                <div className={`RightAreaBtn`} onClick={() => updateType("area")}><AreaIcon size="40%" color={`rgb(${allThemes[getTheme][getType === "area" ? "--main-activ-color" : "--main-second-color-rgb"]})`} /></div>
            </div>

            <div className="RightBtnArea">
                <div className={`RightAreaBtn`} onClick={() => updateType("Reactangle")}><ReactangleIcon size="40%" color={`rgb(${allThemes[getTheme][getType === "Reactangle" ? "--main-activ-color" : "--main-second-color-rgb"]})`} /></div>
                <div className={`RightAreaBtn`} onClick={() => updateType("Circle")}><CircleIcon size="40%" color={`rgb(${allThemes[getTheme][getType === "Circle" ? "--main-activ-color" : "--main-second-color-rgb"]})`} /></div>
                <div className={`RightAreaBtn`} onClick={() => updateType("Polygon")}><PolygonIcon size="40%" color={`rgb(${allThemes[getTheme][getType === "Polygon" ? "--main-activ-color" : "--main-second-color-rgb"]})`} /></div>
                <div className={`RightAreaBtn`} onClick={() => updateType("Import")}><ImportIcon size="50%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
            </div>

            <div className="RightBtnArea">
                <div className="RightAreaBtn" onClick={zoomIn}><PlusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                <div className="RightAreaBtn" onClick={zoomOut}><MinusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
            </div>
        </div>
    )
}
