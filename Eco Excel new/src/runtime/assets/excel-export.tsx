import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate'
import {
	uType, downloadFile
} from '../../config'


export const exportHandler = async (props: {
	data: any,
	name: string,
	km: boolean
}) => {
	const date = new Date()
	let isExtended = true
	let heightCount = 0
	let widthCount = 0

	function NumsFormat(num: any) {
		return Math.round(num * 100) / 100
	}

	function CoorConvert(x: number, y: number) {
		let letters = ""
		while (x > 0) {
			x--
			letters = String.fromCharCode((x % 26) + 65) + letters
			x = Math.floor(x / 26)
		}
		return letters + y
	}

	const valueStyle = {
		border: true,
		bold: true,
		fontSize: 12,
		horizontalAlignment: "center",
		verticalAlignment: "center"
	}

	const colors = [
		'ffffff',
		'C6E0B4',
		'FFD966',
		'92D050',
		'F4B084'
	]
	const names = [
		'11',
		'22',
		'33',
		'44',
		'55'
	]

	const workbook = await XlsxPopulate.fromBlankAsync()
	const sheet = workbook.sheet(0)

	function fillValueCount(x: number, y: number, value: any) {
		sheet.cell(y, x).formula(`${CoorConvert(x + 1, y)} + ${CoorConvert(x + 2, y)}`)
			.style({
				...valueStyle,
				fill: colors[0]
			})

		sheet.cell(y, x + 1).formula(`${CoorConvert(x + 3, y)} + ${CoorConvert(x + 4, y)}`)
			.style({
				...valueStyle,
				fill: colors[1]
			})

		sheet.cell(y, x + 2).value(value[2].count)
			.style({
				...valueStyle,
				fill: colors[2]
			})

		sheet.cell(y, x + 3).value(value[0].count)
			.style({
				...valueStyle,
				fill: colors[3]
			})

		sheet.cell(y, x + 4).value(value[1].count)
			.style({
				...valueStyle,
				fill: colors[4]
			})
	}

	function fillValueSum(x: number, y: number, value: any) {
		sheet.cell(y, x).formula(`${CoorConvert(x + 2, y)} + ${CoorConvert(x + 4, y)}`)
			.style({
				...valueStyle,
				fill: colors[0]
			})

		sheet.cell(y, x + 1).formula(`${CoorConvert(x + 3, y)} + ${CoorConvert(x + 5, y)}`)
			.style({
				...valueStyle,
				fill: colors[0]
			})

		sheet.cell(y, x + 2).formula(`${CoorConvert(x + 6, y)} + ${CoorConvert(x + 8, y)}`)
			.style({
				...valueStyle,
				fill: colors[1]
			})

		sheet.cell(y, x + 3).formula(`${CoorConvert(x + 7, y)} + ${CoorConvert(x + 9, y)}`)
			.style({
				...valueStyle,
				fill: colors[1]
			})

		sheet.cell(y, x + 4).value(value[2].count)
			.style({
				...valueStyle,
				fill: colors[2]
			})

		sheet.cell(y, x + 5).value(NumsFormat(value[2].sum))
			.style({
				...valueStyle,
				fill: colors[2]
			})

		sheet.cell(y, x + 6).value(value[0].count)
			.style({
				...valueStyle,
				fill: colors[3]
			})

		sheet.cell(y, x + 7).value(NumsFormat(value[0].sum))
			.style({
				...valueStyle,
				fill: colors[3]
			})

		sheet.cell(y, x + 8).value(value[1].count)
			.style({
				...valueStyle,
				fill: colors[4]
			})
		sheet.cell(y, x + 9).value(NumsFormat(value[1].sum))
			.style({
				...valueStyle,
				fill: colors[4]
			})
	}
	let yCellPos = 2

	let xCellPos = 4
	let indexPos = 2
	let namesPos = 1


	if (!props.km) {
		xCellPos = 3
		indexPos = 1
		namesPos = 0

		props.data = { [`${date.getFullYear()} йил`]: props.data[`${date.getFullYear()} йил`] }
	}

	// -----------------  Header -------------------------
	sheet.row(yCellPos).height(60)
	sheet.range(2, 2, yCellPos, xCellPos + uType.length * 5)
		.merged(true)
		.value(`2025-йилда аниқланган майдонларнинг жойга чиқиб ўтказилган мониторинг хулосалари бўйича таҳлили (${date.toLocaleDateString()} ҳолатига кўра)`)
		.style({
			bold: true,
			fontSize: 16,
			fill: "FFFFFF",
			border: true,
			horizontalAlignment: "center",
			verticalAlignment: "center"
		})

	yCellPos += 1

	sheet.range(yCellPos, xCellPos - indexPos, yCellPos + 2, xCellPos - indexPos)
		.merged(true)
		.value("№")
		.style({
			...valueStyle,
			fill: colors[0]
		})
	sheet.range(yCellPos, xCellPos - namesPos, yCellPos + 2, xCellPos - namesPos)
		.merged(true)
		.value("Худуд номи")
		.style({
			...valueStyle,
			fill: colors[0]
		})

	if (props.km) {
		sheet.column(xCellPos).width(23)
		sheet.range(yCellPos, xCellPos, yCellPos + 1, xCellPos)
			.value("Мониторинг ўтказилган ҳудуднинг майдони")
			.merged(true)
			.style({
				...valueStyle,
				wrapText: true,
				fill: colors[0]
			})
		sheet.cell(yCellPos + 2, xCellPos)
			.value("км²")
			.style({
				...valueStyle,
				fill: colors[0]
			})
	}

	sheet.row(yCellPos).height( 30 )
	sheet.row(yCellPos + 1).height( 25 )

	// -----------------------------------------------------------------------------------------------
	sheet.range(yCellPos, xCellPos + 1, yCellPos, xCellPos + 10)
		.merged(true)
		.value("Аниқланган объектлар")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})
	
	sheet.range(yCellPos + 1, xCellPos + 1, yCellPos + 1, xCellPos + 2)
		.merged(true)
		.value("1")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos + 1, xCellPos + 3, yCellPos + 1, xCellPos + 4)
		.merged(true)
		.value("2")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos + 1, xCellPos + 5, yCellPos + 1, xCellPos + 6)
		.merged(true)
		.value("3")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos + 1, xCellPos + 7, yCellPos + 1, xCellPos + 8)
		.merged(true)
		.value("4")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos + 1, xCellPos + 9, yCellPos + 1, xCellPos + 10)
		.merged(true)
		.value("5")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})
	
	for( let i = 1; i <= 10; i++ ){
		sheet.cell(yCellPos + 2, xCellPos + i)
			.value(i&1 ? 1 : 2)
			.style({
				...valueStyle,
				wrapText: true,
				fill: colors[0]
			})
	}
	for( let i = 11; i <= 30; i++ ){
		sheet.cell(yCellPos + 2, xCellPos + i)
			.value(names[(i-1)%5])
			.style({
				...valueStyle,
				wrapText: true,
				fill: colors[0]
			})
	}
	// -----------------------------------------------------------------------------------------------
	sheet.range(yCellPos, xCellPos + 11, yCellPos + 1, xCellPos + 15)
		.merged(true)
		.value("Аҳоли яшаш жойларида эҳтимоли юқори бўлган ноқонуний чиқинди полигонлари сони")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos, xCellPos + 16, yCellPos + 1, xCellPos + 20)
		.merged(true)
		.value("Саноат зоналарида эҳтимоли юқори бўлган ноқонуний чиқинди полигонлари сони")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos, xCellPos + 21, yCellPos + 1, xCellPos + 25)
		.merged(true)
		.value("Дарё муҳофаза ҳудудидаги ноқонуний полигонлар сони")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	sheet.range(yCellPos, xCellPos + 26, yCellPos + 1, xCellPos + 30)
		.merged(true)
		.value("Қонуний чиқинди полигонлари чегарасидан ташқарига чиқиш ҳолати сони")
		.style({
			...valueStyle,
			wrapText: true,
			fill: colors[0]
		})

	yCellPos += 2
	sheet.freezePanes(0, yCellPos)
	yCellPos += 1

	Object.keys(props.data).forEach((yearKey: string, yearIndex: number) => {
		// console.log(yearKey);

		Object.keys(props.data[yearKey]).forEach((nameKey: string, nameIndex: number) => {
			// console.log(nameKey);

			if (isExtended) {
				sheet.column(xCellPos - namesPos).width(45)
				sheet.column(xCellPos - indexPos).width(10)
			}

			sheet.cell(yCellPos + nameIndex, xCellPos - namesPos)
				.value(nameKey)
				.style({
					...valueStyle,
					fill: colors[0]
				})
			sheet.cell(yCellPos + nameIndex, xCellPos - indexPos)
				.value(nameIndex + 1)
				.style({
					...valueStyle,
					fill: colors[0]
				})

			sheet.row(yCellPos + nameIndex).height(25)
			props.data[yearKey][nameKey].forEach((typeItem: any, typeIndex: number) => {
				//console.log(typeItem);

				if (typeIndex === 0) {
					if (props.km) {
						sheet.cell(yCellPos + nameIndex, xCellPos + typeIndex).value(typeItem[0].sum)
							.style({
								...valueStyle,
								fill: colors[0]
							})
					}
					widthCount += isExtended ? 1 : 0
				}
				else if (typeIndex === 1) {
					fillValueSum(xCellPos + typeIndex, yCellPos + nameIndex, typeItem)
					widthCount += isExtended ? 10 : 0
				}
				else {
					fillValueCount(1 + xCellPos + typeIndex * 5, yCellPos + nameIndex, typeItem)
					widthCount += isExtended ? 5 : 0
				}
			})
			isExtended = false
			heightCount += 1
		})
		sheet.row(yCellPos + heightCount).height(25)

		sheet.range(yCellPos + heightCount, xCellPos - indexPos, yCellPos + heightCount, xCellPos - namesPos)
			.merged(true)
			.value(`Жами${props.km ? ' ' + yearKey : ''}:`)
			.style({
				...valueStyle,
				fill: colors[0]
			})
		sheet.range(yCellPos + heightCount + 1, xCellPos - indexPos, yCellPos + heightCount + 1, xCellPos - namesPos)
			.merged(true)
			.value(`Жами%${props.km ? ' ' + yearKey : ''}:`)
			.style({
				...valueStyle,
				fill: colors[0]
			})

		for (let i = 0; i < widthCount; i++) {
			sheet.column(xCellPos + i + (namesPos !== 0 ? namesPos : 1)).width(15)

			if (i === 0) {
				if (props.km) {
					sheet.cell(yCellPos + heightCount, xCellPos + i)
						.formula(
							`SUM(${CoorConvert(xCellPos + i, yCellPos)}:${CoorConvert(xCellPos + i, yCellPos + heightCount - 1)})`
						).style({
							...valueStyle,
							fill: colors[0]
						})

					sheet.cell(yCellPos + heightCount + 1, xCellPos + i)
						.value(100).style({
							...valueStyle,
							fill: colors[0]
						})
				}
			}
			else if (i >= 1 && i <= 10) {
				sheet.cell(yCellPos + heightCount, xCellPos + i)
					.formula(
						`SUM(${CoorConvert(xCellPos + i, yCellPos)}:${CoorConvert(xCellPos + i, yCellPos + heightCount - 1)})`
					).style({
						...valueStyle,
						fill: colors[Math.floor((i - 1) / 2)]
					})

				if (i > 2) {
					sheet.cell(yCellPos + heightCount + 1, xCellPos + i)
						.formula(
							`ROUND(${CoorConvert(xCellPos + i, yCellPos + heightCount)}/${CoorConvert(xCellPos + 1 + ((i + 1) % 2), yCellPos + heightCount)}*${CoorConvert(xCellPos + 1 + ((i + 1) % 2), yCellPos + heightCount + 1)}, 2)`
						).style({
							...valueStyle,
							fill: colors[Math.floor((i - 1) / 2)]
						})
				}
				else {
					sheet.cell(yCellPos + heightCount + 1, xCellPos + i)
						.value(100).style({
							...valueStyle,
							fill: colors[0]
						})
				}
			}
			else {
				sheet.cell(yCellPos + heightCount, xCellPos + i)
					.formula(
						`SUM(${CoorConvert(xCellPos + i, yCellPos)}:${CoorConvert(xCellPos + i, yCellPos + heightCount - 1)})`
					).style({
						...valueStyle,
						fill: colors[(i - 1) % 5]
					})

				if ((i - 1) % 5) {
					sheet.cell(yCellPos + heightCount + 1, xCellPos + i)
						.formula(
							`ROUND(${CoorConvert(xCellPos + i, yCellPos + heightCount)}/${CoorConvert(xCellPos + i - ((i - 1) % 5), yCellPos + heightCount)}*${CoorConvert(xCellPos + i - ((i - 1) % 5), yCellPos + heightCount + 1)}, 2)`
						).style({
							...valueStyle,
							fill: colors[(i - 1) % 5]
						})
				}
				else {
					sheet.cell(yCellPos + heightCount + 1, xCellPos + i)
						.value(100).style({
							...valueStyle,
							fill: colors[0]
						})
				}
			}

		}

		isExtended = false

		yCellPos += heightCount + 3
		heightCount = 0
	})

	const blob = await workbook.outputAsync()
	downloadFile(blob, `Ecologiya ${props.name}.xlsx`)
}





// Приношу 100000000 извинений за такой код
