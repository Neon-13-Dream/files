import { React } from "jimu-core";
import "./DragAndDrop.css";
import shp from "shpjs"; // npm install shpjs @types/shpjs (если нужны типы)

import {
    allThemes,
    ImportIcon,
    translate
} from "../../config"

interface dragAndDropProps {
    activ: string
    onChange: (geometries: any[]) => void
    clear: (text: string) => void
    getTheme: string
    getLang: string
};

export default function DragAndDrop(props: dragAndDropProps) {
    const [isImportVisible, setImportVisible] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const maxSize = 15 * 1024 * 1024; // 15MB

        if (file.size > maxSize) {
            alert("Файл слишком большой (макс. 15 МБ)");
            return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase();

        // Добавили kmz в разрешённые расширения
        if (!ext || !["kml", "kmz", "zip", "geojson"].includes(ext)) {
            alert("Неподдерживаемый формат. Разрешены: KML, KMZ, SHP (в ZIP), GeoJSON");
            return;
        }

        try {
            let geometries: any[] = [];

            // KMZ и ZIP — обрабатываем через shpjs (он поддерживает и то, и другое)
            if (ext === "zip" || ext === "kmz") {
                const arrayBuffer = await file.arrayBuffer();
                const geojson = await shp(arrayBuffer);

                // shpjs может вернуть FeatureCollection или один GeoJSON объект
                if (geojson.type === "FeatureCollection" && geojson.features) {
                    geometries = geojson.features
                        .filter((f: any) => f.geometry)
                        .map((f: any) => f.geometry);
                } else if (geojson.type && geojson.coordinates) {
                    // Один объект (например, Polygon)
                    geometries = [geojson];
                } else {
                    alert("Файл не содержит валидных геометрий");
                    return;
                }
            }
            else if (ext === "geojson") {
                const text = await file.text();
                let geojson;
                try {
                    geojson = JSON.parse(text);
                } catch (e) {
                    alert("Некорректный GeoJSON");
                    return;
                }

                if (geojson.type === "FeatureCollection" && geojson.features) {
                    geometries = geojson.features
                        .filter((f: any) => f.geometry)
                        .map((f: any) => f.geometry);
                } else if (geojson.type && geojson.coordinates) {
                    geometries = [geojson];
                } else {
                    alert("GeoJSON не содержит геометрий");
                    return;
                }
            }
            else if (ext === "kml") {
                const text = await file.text();
                geometries = parseKML(text);
                if (geometries.length === 0) {
                    alert("KML файл не содержит поддерживаемых геометрий (Point, LineString, Polygon)");
                    return;
                }
            }

            if (geometries.length === 0) {
                alert("Не найдено ни одной геометрии в файле");
                return;
            }

            props.onChange(geometries);
        } catch (err) {
            console.error("Ошибка обработки файла:", err);
            alert("Ошибка при чтении файла. Возможно, файл повреждён или имеет сложную структуру.");
        }
    };

    const parseKML = (kmlText: string): any[] => {
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        // Проверка на ошибку парсинга
        if (kmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.error("Ошибка парсинга KML");
            return [];
        }

        const geometries: any[] = [];
        const placemarks = kmlDoc.getElementsByTagName("Placemark");

        for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];

            // Polygon
            const polygons = placemark.getElementsByTagName("Polygon");
            for (let p = 0; p < polygons.length; p++) {
                const coordsText = polygons[p].getElementsByTagName("coordinates")[0]?.textContent?.trim();
                if (coordsText) {
                    const rings = coordsText.split(/\s*\n\s*|\s{2,}/).filter(Boolean); // разделяем по строкам или пробелам
                    const outerRing: number[][] = [];
                    for (const coord of rings) {
                        const parts = coord.trim().split(/\s*,\s*|/);
                        if (parts.length >= 2) {
                            const lon = parseFloat(parts[0]);
                            const lat = parseFloat(parts[1]);
                            if (!isNaN(lon) && !isNaN(lat)) {
                                outerRing.push([lon, lat]);
                            }
                        }
                    }
                    if (outerRing.length >= 3) {
                        geometries.push({
                            type: "Polygon",
                            coordinates: [outerRing]
                        });
                    }
                }
            }

            // LineString
            const lines = placemark.getElementsByTagName("LineString");
            for (let l = 0; l < lines.length; l++) {
                const coordsText = lines[l].getElementsByTagName("coordinates")[0]?.textContent?.trim();
                if (coordsText) {
                    const points = coordsText.split(/\s+/).filter(Boolean).map(c => {
                        const [lon, lat] = c.split(",").map(Number);
                        return [lon, lat];
                    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
                    if (points.length >= 2) {
                        geometries.push({
                            type: "LineString",
                            coordinates: points
                        });
                    }
                }
            }

            // Point
            const points = placemark.getElementsByTagName("Point");
            for (let pt = 0; pt < points.length; pt++) {
                const coordsText = points[pt].getElementsByTagName("coordinates")[0]?.textContent?.trim();
                if (coordsText) {
                    const [lon, lat] = coordsText.split(",").map(Number);
                    if (!isNaN(lon) && !isNaN(lat)) {
                        geometries.push({
                            type: "Point",
                            coordinates: [lon, lat]
                        });
                    }
                }
            }
        }

        return geometries;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    React.useEffect(() => {
        setImportVisible(props.activ === "Import");
    }, [props.activ]);

    return isImportVisible ? (
        <div
            className="DragAndDropArea"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => {
                props.clear("none");
                setImportVisible(false);
            }}
        >
            <div
                className="DragAndDropBlock"
                onClick={e => e.stopPropagation()}
            >
                <div className="DragAndDropHeader">
                    <div className="DragAndDropTitle">
                        {translate["Hudud faylini yuklang"][props.getLang]}
                    </div>
                </div>
                <div className="DragAndDropDesc" onClick={handleClick}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept=".kml,.kmz,.zip,.geojson"
                        onChange={handleChange}
                    />
                    <div className="DragAndDropIcon">
                        <ImportIcon size="100%" color={`rgb(${allThemes[props.getTheme]["--main-second-color-rgb"]})`} />
                    </div>
                    <div className="DragAndDropInfo">
                        {translate["Yuklash uchun bosing yoki faylni shu yerga tashlang."][props.getLang]}
                    </div>
                    <div className="DragAndDropInfo">
                        {translate["15 MB gacha bo‘lgan KML yoki SHP fayl"][props.getLang]}
                    </div>
                </div>
            </div>
        </div>
    ) : null;
}