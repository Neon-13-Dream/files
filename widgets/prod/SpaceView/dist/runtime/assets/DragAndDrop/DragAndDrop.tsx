import { React } from "jimu-core";
import "./DragAndDrop.css";
import shp from "shpjs"; // только для ZIP с shapefile

import {
    allThemes,
    ImportIcon,
    translate
} from "../../config";

interface dragAndDropProps {
    activ: string;
    onChange: (geometries: any[]) => void;
    clear: (text: string) => void;
    getTheme: string;
    getLang: string;
};

export default function DragAndDrop(props: dragAndDropProps) {
    const [isImportVisible, setImportVisible] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Вспомогательная функция для извлечения координат из textContent
    const parseCoords = (text: string | undefined | null): number[][] => {
        if (!text) return [];
        return text.trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(c => {
                const parts = c.split(",").map(Number);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    return [parts[0], parts[1]]; // lon, lat
                }
                return null;
            })
            .filter(Boolean) as number[][];
    };

    // Парсинг KML → массив GeoJSON-геометрий
    const parseKMLToGeometries = (kmlText: string): any[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(kmlText, "text/xml");

        if (doc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Ошибка парсинга KML");
        }

        const geometries: any[] = [];

        const placemarks = doc.getElementsByTagName("Placemark");
        for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];

            // Поддержка MultiGeometry
            const multiGeoms = placemark.getElementsByTagName("MultiGeometry");
            if (multiGeoms.length > 0) {
                for (let m = 0; m < multiGeoms.length; m++) {
                    geometries.push(...extractGeometriesFromContainer(multiGeoms[m]));
                }
                continue;
            }

            // Обычные геометрии напрямую в Placemark
            geometries.push(...extractGeometriesFromContainer(placemark));
        }

        return geometries;
    };

    // Внутренняя функция для извлечения геометрий из контейнера (Placemark или MultiGeometry)
    const extractGeometriesFromContainer = (container: Element): any[] => {
        const geoms: any[] = [];

        // Polygon (с поддержкой дыр)
        const polygons = container.getElementsByTagName("Polygon");
        for (let p = 0; p < polygons.length; p++) {
            const poly = polygons[p];
            const outer = poly.getElementsByTagName("outerBoundaryIs")[0];
            const outerCoords = parseCoords(outer?.getElementsByTagName("coordinates")[0]?.textContent);

            if (outerCoords.length < 3) continue;

            const rings: number[][][] = [outerCoords];

            const inners = poly.getElementsByTagName("innerBoundaryIs");
            for (let inn = 0; inn < inners.length; inn++) {
                const innerCoords = parseCoords(inners[inn].getElementsByTagName("coordinates")[0]?.textContent);
                if (innerCoords.length >= 3) {
                    rings.push(innerCoords);
                }
            }

            geoms.push({
                type: "Polygon",
                coordinates: rings
            });
        }

        // LineString / LinearRing
        const lines = container.getElementsByTagName("LineString");
        for (let l = 0; l < lines.length; l++) {
            const coords = parseCoords(lines[l].getElementsByTagName("coordinates")[0]?.textContent);
            if (coords.length >= 2) {
                geoms.push({
                    type: "LineString",
                    coordinates: coords
                });
            }
        }

        // Point
        const points = container.getElementsByTagName("Point");
        for (let pt = 0; pt < points.length; pt++) {
            const coordsText = points[pt].getElementsByTagName("coordinates")[0]?.textContent?.trim();
            if (coordsText) {
                const parts = coordsText.split(",").map(Number);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    geoms.push({
                        type: "Point",
                        coordinates: [parts[0], parts[1]]
                    });
                }
            }
        }

        return geoms;
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const maxSize = 15 * 1024 * 1024; // 15 MB

        if (file.size > maxSize) {
            alert("Файл слишком большой (макс. 15 МБ)");
            return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase();

        if (!ext || !["kml", "kmz", "zip", "geojson"].includes(ext)) {
            alert(translate["15 MB gacha bo‘lgan KML yoki SHP fayl"][props.getLang]);
            return;
        }

        try {
            let geometries: any[] = [];

            // GeoJSON
            if (ext === "geojson") {
                const text = await file.text();
                let json;
                try {
                    json = JSON.parse(text);
                } catch (e) {
                    alert("Некорректный GeoJSON");
                    return;
                }

                if (json.type === "FeatureCollection") {
                    geometries = json.features
                        .filter((f: any) => f.geometry)
                        .map((f: any) => f.geometry);
                } else if (json.type && json.coordinates) {
                    geometries = [json];
                }
            }
            // KML (чистый)
            else if (ext === "kml") {
                console.log(file.name);
                const text = await file.text();
                geometries = parseKMLToGeometries(text);
            }
            // KMZ или ZIP с KML (Google Earth часто сохраняет как KMZ с doc.kml внутри)
            else if (ext === "kmz" || (ext === "zip" && file.name.toLowerCase().includes("kml"))) {
                // Пытаемся распаковать как ZIP и найти .kml внутри
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const zip = await import("jszip"); // динамический импорт, если не хотите добавлять в зависимости
                    const jszip = await zip.loadAsync(arrayBuffer);

                    let kmlFile = null;
                    jszip.forEach((relPath) => {
                        if (relPath.toLowerCase().endsWith(".kml") && !kmlFile) {
                            kmlFile = relPath;
                        }
                    });

                    if (kmlFile) {
                        const kmlText = await jszip.file(kmlFile)!.async("text");
                        geometries = parseKMLToGeometries(kmlText);
                    } else {
                        throw new Error("KML не найден в архиве");
                    }
                } catch (e) {
                    alert("Не удалось обработать KMZ как архив с KML");
                    return;
                }
            }
            // ZIP с Shapefile
            else if (ext === "zip") {
                const arrayBuffer = await file.arrayBuffer();
                const geojson = await shp(arrayBuffer);

                if (geojson.type === "FeatureCollection") {
                    geometries = geojson.features
                        .filter((f: any) => f.geometry)
                        .map((f: any) => f.geometry);
                } else if (geojson.type && geojson.coordinates) {
                    geometries = [geojson];
                }
            }

            if (geometries.length === 0) {
                alert("Не найдено ни одной поддерживаемой геометрии в файле");
                return;
            }

            props.onChange(geometries);
        } catch (err) {
            console.error("Ошибка обработки файла:", err);
            alert("Ошибка при чтении файла. Файл может быть повреждён или иметь неподдерживаемую структуру.");
        }
    };

    // Остальной UI-код без изменений
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