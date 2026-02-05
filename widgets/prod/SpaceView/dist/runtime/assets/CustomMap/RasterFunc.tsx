import ImageryLayer from "@arcgis/core/layers/ImageryLayer"
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import MosaicRule from "@arcgis/core/layers/support/MosaicRule"
import Graphic from "@arcgis/core/Graphic"
import type Extent from "@arcgis/core/geometry/Extent"
import * as projection from "@arcgis/core/geometry/projection"

interface CollectRastersOptions {
    mosaic: string | ImageryLayer;
    polygonLayer: GraphicsLayer;
    outFields: string[];
    where?: string;
    setRasterList: (items: any[]) => void;
    isReady: (readyState: boolean) => void;
}

// проверка валидности extent
function isValidExtent(ext: Extent) {
    return (
        ext &&
        isFinite(ext.xmin) &&
        isFinite(ext.ymin) &&
        isFinite(ext.xmax) &&
        isFinite(ext.ymax) &&
        ext.xmin < ext.xmax &&
        ext.ymin < ext.ymax
    )
}

// проекция extent в 4326
async function normalizeExtent(ext: Extent): Promise<Extent | null> {
    if (!isValidExtent(ext)) return null

    if (ext.spatialReference?.wkid === 4326) return ext

    if (!projection.isSupported()) await projection.load()

    try {
        return projection.project(ext, { wkid: 4326 }) as Extent
    } catch {
        return null
    }
}

async function getRasterThumbnail(raster: any, imageLayer: ImageryLayer, id: number) {
    if (!raster?.geometry?.extent) return null

    let extent = raster.geometry.extent
    extent = await normalizeExtent(extent)
    if (!extent) return null

    const exportUrl = `${imageLayer.url}/exportImage`
    const sr = 4326
    const params = {
        f: "json",
        bbox: `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`,
        bboxSR: sr,
        size: "200,200",
        format: "png"
    }

    const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&")

    const url = `${exportUrl}?${queryString}&mosaicRule=%7B%0D%0A"mosaicMethod"%3A+"esriMosaicLockRaster"%2C%0D%0A++"lockRasterIds"%3A+%5B${id}%5D%0D%0A%7D`

    try {
        const res = await fetch(url)
        const data = await res.json()
        return data?.href || null
    } catch (err) {
        console.warn("Thumbnail skipped for OBJECTID:", raster.attributes?.OBJECTID, err)
        return null
    }
}

export async function collectRastersFromMosaic({
    mosaic,
    polygonLayer,
    outFields,
    where,
    setRasterList,
    isReady
}: CollectRastersOptions) {
    const imageLayer =
        typeof mosaic === "string"
            ? new ImageryLayer({ url: mosaic, visible: true })
            : mosaic as ImageryLayer;

    const visiblePolygons = polygonLayer.graphics.toArray().filter(g => g.visible);

    if (!visiblePolygons.length) {
        imageLayer.mosaicRule = new MosaicRule({ method: "attribute", where: "1=0" });
        setRasterList([]);
        isReady(true);
        return;
    }

    const rasterMap = new Map<number, any>();

    // 1. Собираем все растры без thumbnails
    for (const graphic of visiblePolygons) {
        const query: any = {
            geometry: graphic.geometry,
            spatialRelationship: "intersects",
            returnGeometry: true,
            outFields: outFields,
            where: where?.length > 0 ? where + " AND Name NOT LIKE 'Ov%' AND Viloyat <> 'Sirdaryo viloyati'" : "Name NOT LIKE 'Ov%' AND Viloyat <> 'Sirdaryo viloyati'",
        };

        const result = await imageLayer.queryRasters(query);

        for (const f of result.features) {
            const id = f.attributes.OBJECTID;
            if (rasterMap.has(id)) continue;

            const geom = f.geometry;
            if (!geom || !geom.extent) continue;

            const extent = await normalizeExtent(geom.extent);
            if (!extent) continue;

            const ring: number[][] = [
                [extent.xmin, extent.ymin],
                [extent.xmin, extent.ymax],
                [extent.xmax, extent.ymax],
                [extent.xmax, extent.ymin],
                [extent.xmin, extent.ymin]
            ];

            rasterMap.set(id, {
                id,
                visible: true,
                attributes: f.attributes,
                thumbnail: null,
                ring,
                spatialReference: extent.spatialReference,
                _extent: extent  // сохраняем нормализованный extent
            });
        }
    }

    const tempList = [...rasterMap.values()];

    // Сразу показываем список (даже без картинок)
    setRasterList(tempList);

    if (tempList.length === 0) {
        imageLayer.visible = false;
        isReady(true);
        return;
    }

    // Устанавливаем mosaic rule
    imageLayer.mosaicRule = new MosaicRule({
        method: "attribute",
        where: `OBJECTID IN (${tempList.map(r => r.id).join(",")})`
    });
    imageLayer.visible = true;

    // 2. Загружаем thumbnails и обновляем список по мере готовности
    const updatedList = [...tempList];

    await Promise.all(
        updatedList.map(async (item, index) => {
            try {
                const thumbnail = await getRasterThumbnail(
                    { geometry: { extent: item._extent } },
                    imageLayer,
                    item.id
                );
                if (thumbnail) {
                    updatedList[index].thumbnail = thumbnail;
                    setRasterList([...updatedList]);
                }
            } catch (err) {
                console.warn("Failed to load thumbnail for OBJECTID:", item.id, err);
            }
        })
    );

    // Финальное обновление (убираем служебное поле _extent)
    const finalList = updatedList.map(({ _extent, ...rest }) => rest);
    setRasterList(finalList);
    isReady(true);
}