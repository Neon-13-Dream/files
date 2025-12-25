import { React } from "jimu-core"
import type { dataStruct } from "../../config"
import "./CustomMap.css"

import Map from "@arcgis/core/Map"
import MapView from "@arcgis/core/views/MapView"
import Graphic from "@arcgis/core/Graphic"
import ImageryLayer from "@arcgis/core/layers/ImageryLayer"
import { Extent } from "@arcgis/core/geometry"
import MosaicRule from "@arcgis/core/layers/support/MosaicRule"
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine"
import Point from "@arcgis/core/geometry/Point"
import Polygon from "@arcgis/core/geometry/Polygon"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol"
import Polyline from "@arcgis/core/geometry/Polyline"
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"

import LeftArea from "./LeftArea/LeftArea"
import BottomArea from "./BottomArea/BottomArea"
import RightArea from "./RightArea/RightArea"
import { collectRastersFromMosaic } from "./RasterFunc"

import * as mgrs from "mgrs"

interface customMapProps {
    fetchUrl: string
    headerInfo: any[]
    file: any
    getTheme: string
    getLang: string
    onChange: (type: string, data: any) => void
}

export default function CustomMap({
    fetchUrl,
    headerInfo,
    file,
    getTheme,
    onChange,
    getLang
}: customMapProps) {
    const [getReady, setReady] = React.useState(true)
    const typeRef = React.useRef("none")
    const mousePointRef = React.useRef<GraphicsLayer | null>(null)
    const importantAreas = React.useRef<GraphicsLayer | null>(null)
    const mosaicLayers = React.useRef<ImageryLayer | null>(null)
    const mapContainerRef = React.useRef<HTMLDivElement>(null)
    const rasterPolygon = React.useRef<GraphicsLayer | null>(null)
    const lineLayer = React.useRef<GraphicsLayer | null>(null)
    const lineTextLayer = React.useRef<GraphicsLayer | null>(null)
    const OverlayLayer = React.useRef<ImageryLayer | null>(null)
    const polygonSymbol = React.useRef<SimpleFillSymbol>(new SimpleFillSymbol({
        color: [55, 115, 213, 0],
        outline: { color: [55, 115, 213, 0.6], width: 2 }
    }))
    const polygonHoverSymbol = React.useRef<SimpleFillSymbol>(new SimpleFillSymbol({
        color: [255, 115, 20, 0],
        outline: { color: [255, 115, 20, 0.6], width: 2 }
    }))
    const lineSymbol = new SimpleLineSymbol({
        color: [55, 115, 213, 0.9],
        width: 3
    })

    const linePointSymbol = new SimpleMarkerSymbol({
        style: "circle",
        size: 8,
        color: [255, 255, 255, 1],
        outline: {
            color: [55, 115, 213, 0.9],
            width: 2
        }
    })

    const [view, setView] = React.useState<MapView | null>(null)
    const [geometryList, setGeometryList] = React.useState<any[]>([])
    const [rasterList, setRasterList] = React.useState<any[]>([])
    const [getListAction, setListAction] = React.useState({
        type: "none",
        index: -1
    })
    const [mapData, setMapData] = React.useState<dataStruct>({
        GCS: { lon: 61.696894, lat: 41.408488 },
        MGRS: "",
        mapScale: 1,
        mapZoom: 1
    })

    const whereRef = React.useRef("")
    const debounceTimer = React.useRef<number | null>(null)
    const debouncedCollect = React.useCallback((
        where: string
    ) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        debounceTimer.current = window.setTimeout(async () => {
            setReady(false)
            await collectRastersFromMosaic({
                mosaic: mosaicLayers.current,
                polygonLayer: importantAreas.current,
                outFields: ["*"],
                setRasterList,
                where,
                isReady: (readyState: boolean) => { setReady(readyState) }
            })
        }, 300)
    }, [])

    function haversineDistance(p1: Point, p2: Point): number {
        const R = 6371000
        const toRad = (deg: number) => deg * Math.PI / 180

        const dLat = toRad(p2.latitude - p1.latitude)
        const dLon = toRad(p2.longitude - p1.longitude)

        const lat1 = toRad(p1.latitude)
        const lat2 = toRad(p2.latitude)

        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    React.useEffect(() => {
        async function run() {
            if (!file || file.length === 0) return

            const newGeometries: any[] = []
            const addedGraphics: Graphic[] = []

            file.forEach((item: any) => {
                if (item.type === "Polygon") {
                    const newGeo = new Graphic({
                        geometry: new Polygon({ rings: item.coordinates }),
                        symbol: polygonSymbol.current,
                        attributes: { name: item.name || "FilePolygon" }
                    })
                    importantAreas.current?.add(newGeo)
                    addedGraphics.push(newGeo)

                    const area = Math.abs(geometryEngine.geodesicArea(
                        newGeo.geometry as Polygon,
                        "square-kilometers"
                    )).toFixed(3)

                    newGeometries.push({
                        name: newGeo.attributes.name,
                        visible: true,
                        area: area
                    })
                }
            })

            // Обновляем state geometryList
            setGeometryList((prev: any) => [...prev, ...newGeometries])

            // Приближаем к первому или последнему полигону (например, к первому)
            if (view && addedGraphics.length > 0) {
                const targetGraphic = addedGraphics[0] // или addedGraphics[addedGraphics.length - 1] для последнего
                if (targetGraphic.geometry.extent) {
                    await view.goTo({
                        target: targetGraphic.geometry.extent.expand(1.2)
                    })
                }
            }
            debouncedCollect(getListAction.index)
        }

        run()
    }, [file, view])

    React.useEffect(() => {
        if (getListAction.type === "none") return

        const run = async () => {
            let activList = null
            let graphic = null

            if (getListAction.type === "where") {
                whereRef.current = getListAction.index
                debouncedCollect(getListAction.index)
                return
            }

            if (getListAction.type[0] === 'g') {
                activList = geometryList
                graphic = importantAreas.current.graphics.getItemAt(getListAction.index)
            }
            else {
                activList = rasterList
                graphic = rasterPolygon.current.graphics.getItemAt(0)
            }

            switch (getListAction.type) {
                case 'gToggel': {
                    if (!importantAreas.current || !activList) return
                    if (!graphic) return

                    graphic.visible = !activList[getListAction.index].visible
                    activList[getListAction.index].visible =
                        !activList[getListAction.index].visible
                    break
                }

                case 'gDelete': {
                    if (!importantAreas.current || !activList) return
                    if (!graphic) return

                    importantAreas.current.remove(graphic)

                    const newList = activList.filter((_: any, i: any) => i !== getListAction.index)

                    setGeometryList([...newList])
                    activList = newList
                    break
                }

                case 'gZoom': {
                    if (!importantAreas.current || !activList || !view) return
                    if (!graphic) return

                    await view.goTo({
                        target: graphic.geometry.extent.expand(1.2)
                    })
                    break
                }

                case 'gShowAll': {
                    if (!importantAreas.current || !activList) return

                    activList.forEach((item: any, i: number) => {
                        const g = importantAreas.current.graphics.getItemAt(i)
                        if (g) g.visible = true
                        item.visible = true
                    })
                    break
                }

                case 'gHideAll': {
                    if (!importantAreas.current || !activList) return

                    activList.forEach((item: any, i: number) => {
                        const g = importantAreas.current.graphics.getItemAt(i)
                        if (g) g.visible = false
                        item.visible = false
                    })
                    break
                }

                case 'gHover': {
                    if (!graphic) return
                    importantAreas.current?.graphics.forEach((g: Graphic) => {
                        if (g.attributes.__defaultSymbol) {
                            g.symbol = g.attributes.__defaultSymbol
                            delete g.attributes.__defaultSymbol // опционально
                        }
                    })
                    if (!graphic.attributes.__defaultSymbol) {
                        graphic.attributes.__defaultSymbol = graphic.symbol
                    }
                    graphic.symbol = polygonHoverSymbol.current
                    break
                }

                case 'gUnhover': {
                    if (getListAction.index === -1) {
                        // Сброс hover со всех геометрий
                        importantAreas.current?.graphics.forEach((g: Graphic) => {
                            if (g.attributes.__defaultSymbol) {
                                g.symbol = g.attributes.__defaultSymbol
                                delete g.attributes.__defaultSymbol // опционально
                            }
                        })
                    } else {
                        // Обычный случай — один элемент
                        if (!graphic) return
                        if (graphic.attributes.__defaultSymbol) {
                            graphic.symbol = graphic.attributes.__defaultSymbol
                        }
                    }
                    break
                }

                case "rHover": {
                    if (!graphic) return

                    const item = activList[getListAction.index]
                    if (!item?.ring) return

                    graphic.geometry = new Polygon({
                        rings: [item.ring],
                        spatialReference: item.spatialReference
                    })

                    graphic.symbol = polygonHoverSymbol.current
                    graphic.visible = true
                    break
                }

                case "rUnhover": {
                    if (!graphic) return
                    graphic.visible = false
                    break
                }

                case "rClicked": {
                    graphic = rasterPolygon.current.graphics.getItemAt(1)
                    if (!graphic) return

                    if (getListAction.index >= 0) {
                        const item = activList[getListAction.index]
                        if (!item?.ring) return

                        graphic.geometry = new Polygon({
                            rings: [item.ring],
                            spatialReference: item.spatialReference
                        })

                        graphic.symbol = polygonHoverSymbol.current
                        graphic.visible = true
                    }
                    else {
                        graphic.visible = false
                    }
                    break
                }

                case "rToggel": {
                    if (!mosaicLayers.current || !rasterList.length) return
                    activList[getListAction.index].visible = !activList[getListAction.index].visible
                    const visibleIDs = rasterList.filter((r: any) => r.visible).map((r: any) => r.id)

                    const newRule = new MosaicRule({
                        method: "attribute",
                        where: visibleIDs.length > 0
                            ? `OBJECTID IN (${visibleIDs.join(",")})`
                            : "1=0"  // на случай если все выключены
                    })
                    mosaicLayers.current.mosaicRule = newRule

                    // Принудительный redraw
                    mosaicLayers.current.visible = false;
                    setTimeout(() => {
                        mosaicLayers.current.visible = true;
                    }, 0);  // через setTimeout, чтобы в следующем тике React

                    break
                }

                case "rHideAll": {
                    if (!mosaicLayers.current || !rasterList.length) return

                    activList.forEach((item: any) => {
                        item.visible = false
                    })

                    mosaicLayers.current.mosaicRule = new MosaicRule({
                        method: "attribute",
                        where: "1=0"
                    })
                    break
                }

                case "rShowAll": {
                    if (!mosaicLayers.current || !rasterList.length) return

                    activList.forEach((item: any) => {
                        item.visible = true
                    })

                    const visibleIDs = rasterList.filter((r: any) => r.visible).map((r: any) => r.id)

                    mosaicLayers.current.mosaicRule = new MosaicRule({
                        method: "attribute",
                        where: `OBJECTID IN (${visibleIDs.join(",")})`
                    })
                    break
                }
            }

            if (getListAction.type[0] === 'g') {
                if (getListAction.type !== 'gDelete') setGeometryList([...activList])
                setReady(false)
                await collectRastersFromMosaic({
                    mosaic: mosaicLayers.current,
                    polygonLayer: importantAreas.current,
                    outFields: ["*"],
                    setRasterList,
                    isReady: (readyState: boolean) => { setReady(readyState) }
                })
            }
            if (getListAction.type[0] === 'r') {
                setRasterList([...activList])
            }
        }

        run()
    }, [getListAction])


    React.useEffect(() => {
        if (!view) return

        if (headerInfo[0] === "address") {
            view.goTo({
                center: new Extent(headerInfo[1])
            }, {
                duration: 500,
                easing: "ease-in-out"
            })
        }
    }, [headerInfo, view])

    React.useEffect(() => {
        let geoPoints: number[][] = []
        let previewLine: Graphic | null = null
        let currentLineId: number | null = null

        if (!mapContainerRef.current) return

        const map = new Map({
            basemap: "topo",
        })

        const mapView = new MapView({
            map,
            container: mapContainerRef.current,
            center: [mapData.GCS.lon, mapData.GCS.lat],
            zoom: 6,
            constraints: {
                minZoom: 3,
                maxZoom: 20,
                snapToZoom: false
            },
            ui: { components: [] }
        })

        mosaicLayers.current = new ImageryLayer({
            url: fetchUrl,
            mosaicRule: new MosaicRule({
                method: "attribute",
                where: "1=0"
            })
        })

        OverlayLayer.current = new ImageryLayer({
            url: fetchUrl,
            visible: false
        })

        importantAreas.current = new GraphicsLayer({ id: "ImportantAreas" })
        rasterPolygon.current = new GraphicsLayer({ id: "rasterPolygon" })
        mousePointRef.current = new GraphicsLayer({ id: "mousePoint", visible: false })
        lineLayer.current = new GraphicsLayer({ id: "LineLayer" })
        lineTextLayer.current = new GraphicsLayer({ id: "LineTextLayer" })

        const hoverGraphic = new Graphic({
            geometry: new Polygon({ rings: [[]] }),
            symbol: polygonSymbol.current,
            attributes: { name: "preview" }
        })

        // Graphic для hover (индекс 0)
        const hoverRasterGraphic = new Graphic({
            geometry: new Polygon({ rings: [[]] }),
            symbol: polygonHoverSymbol.current,
            visible: false
        })

        // Graphic для clicked (индекс 1) — более яркий стиль
        const clickedRasterSymbol = new SimpleFillSymbol({
            color: [255, 140, 0, 0.2],           // ярко-оранжевый с прозрачностью
            outline: { color: [255, 100, 0, 1], width: 3 }
        })

        const clickedRasterGraphic = new Graphic({
            geometry: new Polygon({ rings: [[]] }),
            symbol: clickedRasterSymbol,
            visible: false
        })

        rasterPolygon.current.add(hoverRasterGraphic)
        rasterPolygon.current.add(clickedRasterGraphic)
        mousePointRef.current.add(hoverGraphic)

        map.add(lineLayer.current)
        map.add(lineTextLayer.current)

        map.add(OverlayLayer.current)
        map.add(mosaicLayers.current)
        map.add(importantAreas.current)
        map.add(rasterPolygon.current)
        map.add(lineLayer.current)
        map.add(lineTextLayer.current)
        map.add(mousePointRef.current)

        setView(mapView)

        const keyD = mapView.on("key-down", (event: __esri.ViewKeyDownEvent) => {
            if (event.key === "Escape") {
                geoPoints = []

                // Убираем preview-полигон
                const hover = mousePointRef.current?.graphics.getItemAt(0)
                if (hover) {
                    hover.geometry = null
                }

                // Убираем preview линию
                previewLine = null
                lineLayer.current?.removeAll()
                lineTextLayer.current?.removeAll()
            }
        })

        const dbl = mapView.on("double-click", async (event: any) => {
            event.stopPropagation()
            const p = mapView.toMap(event)

            let newGraphic: Graphic | null = null

            if (typeRef.current === "Polygon" && geoPoints.length > 1) {
                const ring = [...geoPoints, [p.longitude, p.latitude]]

                newGraphic = new Graphic({
                    geometry: new Polygon({
                        rings: [ring],
                        spatialReference: { wkid: 4326 }
                    }),
                    symbol: hoverGraphic.symbol,
                    attributes: { name: "Polygon" }
                })
            }
            else if (typeRef.current === "Circle" && geoPoints.length === 1) {
                const center = new Point({
                    longitude: geoPoints[0][0],
                    latitude: geoPoints[0][1],
                    spatialReference: { wkid: 4326 }
                })

                const radius = haversineDistance(center, p)

                newGraphic = new Graphic({
                    geometry: geometryEngine.geodesicBuffer(center, radius, "meters") as Polygon,
                    symbol: hoverGraphic.symbol,
                    attributes: { name: "Circle" }
                })
            }
            else if (typeRef.current === "Reactangle" && geoPoints.length === 1) {
                const ring = [
                    [...geoPoints[0]],
                    [geoPoints[0][0], p.latitude],
                    [p.longitude, p.latitude],
                    [p.longitude, geoPoints[0][1]]
                ]

                newGraphic = new Graphic({
                    geometry: new Polygon({
                        rings: [ring],
                        spatialReference: { wkid: 4326 }
                    }),
                    symbol: hoverGraphic.symbol,
                    attributes: { name: "Rectangle" }
                })
            }
            else if (typeRef.current === "line" && geoPoints.length >= 1) {
                lineLayer.current?.removeAll()
                lineTextLayer.current?.removeAll()
                previewLine = null
                currentLineId = null
            }
            else if (typeRef.current === "area") {
                geoPoints = []
                previewLine = null
                currentLineId = null

                lineLayer.current?.removeAll()
                lineTextLayer.current?.removeAll()
                return // предотвращаем дальнейшие действия
            }


            geoPoints = []

            if (!newGraphic) return

            importantAreas.current.add(newGraphic)

            let area: any = 0

            if (newGraphic.geometry instanceof Polygon) {
                // area = Math.floor(geometryEngine.geodesicArea(
                //     newGraphic.geometry,
                //     "square-kilometers"
                // ) * 100) / 100
                area = Math.abs(geometryEngine.geodesicArea(
                    newGraphic.geometry,
                    "square-kilometers"
                )).toFixed(3)
            }

            setGeometryList((prev: any) => [
                ...prev,
                {
                    name: newGraphic.attributes.name,
                    visible: true,
                    area: area
                }
            ])
            debouncedCollect(getListAction.index)
        })

        const clickEv = mapView.on("click", (event: any) => {
            if (typeRef.current === "none" || typeRef.current === "address") return

            if (
                typeRef.current !== "Polygon" &&
                typeRef.current !== "line" &&
                typeRef.current !== "area" &&
                geoPoints.length === 1
            ) return

            if (typeRef.current === "line") {

                // первый клик — создаём ID линии
                if (geoPoints.length === 0) {
                    currentLineId = Date.now()
                }

                const newPoint: number[] = [
                    event.mapPoint.longitude,
                    event.mapPoint.latitude
                ]

                geoPoints.push(newPoint)

                // ⭕ точка ПОСЛЕ линии
                lineLayer.current?.add(new Graphic({
                    geometry: new Point({
                        longitude: newPoint[0],
                        latitude: newPoint[1],
                        spatialReference: { wkid: 4326 }
                    }),
                    symbol: linePointSymbol,
                    attributes: {
                        type: "line-point",
                        lineId: currentLineId
                    }
                }))

                // 📏 фиксируем расстояние сегмента
                if (geoPoints.length >= 2) {
                    const p1 = geoPoints[geoPoints.length - 2]
                    const p2 = geoPoints[geoPoints.length - 1]

                    const seg = new Polyline({
                        paths: [[p1, p2]],
                        spatialReference: { wkid: 4326 }
                    })

                    const dist = geometryEngine.geodesicLength(seg, "meters")

                    const mid = new Point({
                        longitude: (p1[0] + p2[0]) / 2,
                        latitude: (p1[1] + p2[1]) / 2,
                        spatialReference: { wkid: 4326 }
                    })

                    lineTextLayer.current?.add(new Graphic({
                        geometry: mid,
                        symbol: new TextSymbol({
                            text: dist > 1000
                                ? `${(dist / 1000).toFixed(2)} км`
                                : `${dist.toFixed(1)} м`,
                            color: "#000",
                            haloColor: "#fff",
                            haloSize: 2,
                            font: { size: 12, weight: "bold" }
                        }),
                        attributes: {
                            type: "line-text",
                            lineId: currentLineId,
                            segmentIndex: geoPoints.length - 2
                        }
                    }))
                }

                return
            }

            if (typeRef.current === "area") {
                if (geoPoints.length === 0) currentLineId = Date.now()

                const newPoint: number[] = [event.mapPoint.longitude, event.mapPoint.latitude]
                geoPoints.push(newPoint)

                // точка на слое lineLayer
                lineLayer.current?.add(new Graphic({
                    geometry: new Point({
                        longitude: newPoint[0],
                        latitude: newPoint[1],
                        spatialReference: { wkid: 4326 }
                    }),
                    symbol: linePointSymbol,
                    attributes: {
                        type: "line-point",
                        lineId: currentLineId
                    }
                }))
                return
            }

            geoPoints.push([event.mapPoint.longitude, event.mapPoint.latitude])
        })

        const moveEv = mapView.on("pointer-move", (event: any) => {
            const p = mapView.toMap(event)
            lineTextLayer.current?.graphics
                .filter((g: any) => g.attributes?.type === "line-text-preview")
                .forEach((g: any) => { lineTextLayer.current?.remove(g) })


            if (!p) return

            if (typeRef.current === "Polygon") {
                const ring = [...geoPoints, [p.longitude, p.latitude]]
                hoverGraphic.geometry = new Polygon({
                    rings: [ring],
                    spatialReference: { wkid: 4326 }
                })
            }
            else if (typeRef.current === "Circle" && geoPoints.length === 1) {
                const center = new Point({
                    longitude: geoPoints[0][0],
                    latitude: geoPoints[0][1],
                    spatialReference: { wkid: 4326 }
                })
                const radius = haversineDistance(center, p)
                hoverGraphic.geometry = geometryEngine.geodesicBuffer(center, radius, "meters") as Polygon
            }
            else if (typeRef.current === "Reactangle" && geoPoints.length === 1) {
                const ring = [
                    [...geoPoints[0]],
                    [geoPoints[0][0], p.latitude],
                    [p.longitude, p.latitude],
                    [p.longitude, geoPoints[0][1]]
                ]
                hoverGraphic.geometry = new Polygon({
                    rings: [ring],
                    spatialReference: { wkid: 4326 }
                })
            }
            else if (typeRef.current === "line") {
                const currentPoints =
                    geoPoints.length === 0
                        ? [[p.longitude, p.latitude]]
                        : [...geoPoints, [p.longitude, p.latitude]]

                const polyline = new Polyline({
                    paths: [currentPoints],
                    spatialReference: { wkid: 4326 }
                })

                if (!previewLine) {
                    previewLine = new Graphic({
                        geometry: polyline,
                        symbol: lineSymbol
                    })
                    lineLayer.current?.add(previewLine)
                } else {
                    previewLine.geometry = polyline
                }

                if (geoPoints.length >= 1) {
                    const last = geoPoints[geoPoints.length - 1]
                    const curr = [p.longitude, p.latitude]

                    const seg = new Polyline({
                        paths: [[last, curr]],
                        spatialReference: { wkid: 4326 }
                    })

                    const dist = geometryEngine.geodesicLength(seg, "meters")

                    const mid = new Point({
                        longitude: (last[0] + curr[0]) / 2,
                        latitude: (last[1] + curr[1]) / 2,
                        spatialReference: { wkid: 4326 }
                    })

                    lineTextLayer.current?.add(new Graphic({
                        geometry: mid,
                        symbol: new TextSymbol({
                            text: dist > 1000
                                ? `${(dist / 1000).toFixed(2)} км`
                                : `${dist.toFixed(1)} м`,
                            color: "#000",
                            haloColor: "#fff",
                            haloSize: 2,
                            font: { size: 12, weight: "bold" }
                        }),
                        attributes: {
                            type: "line-text-preview",
                            lineId: currentLineId
                        }
                    }))
                }
            }
            else if (typeRef.current === "area") {
                if (geoPoints.length === 0) return

                const currentPoints = [...geoPoints, [p.longitude, p.latitude]]

                // ⚠️ создаём новый график, если previewLine был линией
                if (!previewLine || !(previewLine.geometry instanceof Polygon)) {
                    // удаляем старый, если есть
                    if (previewLine) lineLayer.current?.remove(previewLine)

                    previewLine = new Graphic({
                        geometry: new Polygon({ rings: [currentPoints], spatialReference: { wkid: 4326 } }),
                        symbol: polygonSymbol.current
                    })
                    lineLayer.current?.add(previewLine)
                } else {
                    previewLine.geometry = new Polygon({ rings: [currentPoints], spatialReference: { wkid: 4326 } })
                    previewLine.symbol = polygonSymbol.current // обязательно заново назначаем символ
                }

                // расчёт площади и отображение текста в центре
                const area = Math.abs(geometryEngine.geodesicArea(previewLine.geometry as Polygon, "square-kilometers"))
                const center = (previewLine.geometry as Polygon).centroid

                lineTextLayer.current?.removeAll() // очищаем старые тексты
                lineTextLayer.current?.add(new Graphic({
                    geometry: center,
                    symbol: new TextSymbol({
                        text: `${area.toFixed(2)} км²`,
                        color: "#000",
                        haloColor: "#fff",
                        haloSize: 2,
                        font: { size: 14, weight: "bold" }
                    }),
                    attributes: { type: "area-center" }
                }))
            }
            else {
                hoverGraphic.geometry = new Polygon({
                    rings: [[[p.longitude, p.latitude]]],
                    spatialReference: { wkid: 4326 }
                })
            }

            setMapData((prev: any) => ({
                ...prev,
                GCS: {
                    lat: p.latitude.toFixed(6),
                    lon: p.longitude.toFixed(6)
                },
                MGRS: mgrs.forward([p.longitude, p.latitude], 4)
            }))
        })

        return () => {
            dbl.remove()
            clickEv.remove()
            moveEv.remove()
            keyD.remove()
            mapView.destroy()
        }
    }, [])

    const memoGeomList = React.useMemo(() => geometryList, [geometryList])
    const memoRasterList = React.useMemo(() => rasterList, [rasterList])
    const handleChange = React.useCallback((type: string, index: number) => {
        setListAction({ type, index })
    }, [])

    return (
        <div ref={mapContainerRef} className="mapArea">
            <LeftArea
                geomList={memoGeomList}
                rasterList={memoRasterList}
                onChange={handleChange}
                getTheme={getTheme}
                getLang={getLang}
                isReady={getReady}
            />

            {view && (
                <BottomArea
                    viewMap={view}
                    mapData={mapData}
                    onChange={setMapData}
                    getTheme={getTheme}
                />
            )}

            {view && (
                <RightArea
                    map={view}
                    overlayMap={OverlayLayer.current}
                    onChange={(type: string) => {
                        if (type === "Import") {
                            onChange("Import", "Import")
                        }
                        else {
                            typeRef.current = type
                            if (mousePointRef.current) {
                                mousePointRef.current.visible = !(
                                    type === "none"
                                )
                            }
                            onChange(type, type)
                        }
                    }}
                    getTheme={getTheme}
                    getLang={getLang}
                />
            )}
        </div>
    )
}
