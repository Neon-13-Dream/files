/** @jsx jsx */
import {
	React, jsx, type AllWidgetProps,
	DataSourceComponent,
	type FeatureDataRecord
} from 'jimu-core'
import { uType, downloadsData, GroupCheck } from '../config'
import { exportHandler } from './assets/excel-export'

export default function Widget(props: AllWidgetProps<any>) {
	const useDataSource = props.useDataSources?.[0]
	const allData = React.useRef({})
	const userGroup = React.useRef<GroupCheck>(new GroupCheck(props.user.groups.map((v: any) => v.title)))

	const updateData = (main: any, count: number, sum: number) => {
		main.count += count
		main.sum += sum
	}

	const download = (name: string) => {
		console.log("Button key: ", name)
		exportHandler({ data: allData.current, name: name, km: name === "Excel ( Умумий )" })
	}

	const dataSourceCreated = (ds: any) => {
		ds.query({
			where: userGroup.current.gerWhere("viloyat", "kiril"),
			outFields: ['sana', "viloyat", 'tur', "maydon", "km_hudud", "tekshirish"],
			groupByFieldsForStatistics: ['sana', "viloyat", 'tur', "tekshirish"],
			returnGeometry: false,
			outStatistics: [
				{
					statisticType: 'sum',
					onStatisticField: 'maydon',
					outStatisticFieldName: 'maydon_sum'
				},
				{
					statisticType: 'count',
					onStatisticField: 'maydon',
					outStatisticFieldName: 'maydon_count'
				},
				{
					statisticType: 'sum',
					onStatisticField: 'km_hudud',
					outStatisticFieldName: 'km_sum'
				}
			],
			orderByFields: [
				'sana ASC',
				'viloyat ASC'
			]
		}).then((result: any) => {
			const recs = result.records as FeatureDataRecord[]

			const uYears = Array.from(new Set(recs.map(r => r.getFieldValue("sana")))).sort()
			const uCheck = Array.from(new Set(recs.map(r => r.getFieldValue("tekshirish")))).sort()
			allData.current = Object.fromEntries(uYears.map((v: any) => [v, {}]))

			recs.forEach((item: any) => {
				item = { ...item.getData() }

				const namesIndex = item.viloyat
				const typesIndex = uType.indexOf(item.tur)
				const checkIndex = uCheck.indexOf(item.tekshirish)

				if (typesIndex >= 0) {
					if (!allData.current[item.sana][namesIndex]) {
						allData.current[item.sana][namesIndex] = uType.map(type => {
							if (type === "Мониторинг ўтказилган ҳудуднинг майдони") {
								return [{ count: 0, sum: 0 }]
							} else {
								return uCheck.map(() => ({ count: 0, sum: 0 }))
							}
						})
					}

					// console.log(item);

					// console.log(namesIndex, item["viloyat"]);
					// console.log(typesIndex, item["tur"]);
					// console.log(checkIndex, item["tekshirish"]);

					// console.log(1, allData[item["sana"]][namesIndex])
					// console.log(2, allData[item["sana"]][namesIndex][typesIndex])
					// console.log(3, allData[item["sana"]][namesIndex][typesIndex][checkIndex])

					updateData(allData.current[item.sana][namesIndex][typesIndex][checkIndex], item.maydon_count, item.maydon_sum)
					updateData(allData.current[item.sana][namesIndex][uType.indexOf("Аниқланган объектлар")][checkIndex], item.maydon_count, item.maydon_sum)

					if (item.km_sum) {
						updateData(allData.current[item.sana][namesIndex][uType.indexOf("Мониторинг ўтказилган ҳудуднинг майдони")][0], 1, item.km_sum)
					}
				}
			})

			console.log(allData)
		})
	}


	return (
		<div style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '100%',
			height: '100%'
		}}>
			{useDataSource ?
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
					height: '100%'
				}}>
					<DataSourceComponent
						useDataSource={useDataSource}
						onDataSourceCreated={dataSourceCreated}
					/>

					<div style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'left',
						width: '100%',
						height: 'Calc( 100% - 50px )',
						padding: '10px',
						gap: '5px'
					}}>
						{downloadsData.map((item: any, key: number) => (
							<div style={{
								width: '100%',

								position: 'relative',

								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '2px',
								padding: '2px'
							}} key={key}>
								<div style={{
									fontSize: '15px',
									fontWeight: 'bold'
								}}>{item}</div>

								<div style={{
									width: '20px',
									height: '20px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}} onClick={() => { download(item) }}>
									<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 20 20" fill='000'>
										<path style={{
											stroke: "none",
											fillRule: "nonzero",
											fillOpacity: "1"
										}} d="M 10.578125 1.828125 C 10.765625 2.015625 10.863281 2.234375 10.863281 2.5 C 10.863281 2.53125 10.863281 2.5625 10.867188 2.597656 C 10.867188 2.628906 10.867188 2.664062 10.867188 2.699219 C 10.867188 2.734375 10.867188 2.773438 10.867188 2.808594 C 10.867188 2.929688 10.867188 3.054688 10.867188 3.175781 C 10.867188 3.261719 10.867188 3.351562 10.867188 3.4375 C 10.871094 3.675781 10.871094 3.914062 10.871094 4.148438 C 10.871094 4.398438 10.875 4.644531 10.875 4.894531 C 10.875 5.3125 10.878906 5.726562 10.878906 6.144531 C 10.878906 6.574219 10.882812 7.003906 10.882812 7.429688 C 10.882812 7.457031 10.882812 7.484375 10.882812 7.511719 C 10.882812 7.644531 10.886719 7.777344 10.886719 7.910156 C 10.890625 9.011719 10.894531 10.109375 10.898438 11.210938 C 10.933594 11.175781 10.964844 11.140625 11 11.105469 C 11.324219 10.78125 11.644531 10.457031 11.96875 10.132812 C 12.136719 9.964844 12.300781 9.796875 12.464844 9.632812 C 12.625 9.46875 12.785156 9.308594 12.945312 9.148438 C 13.007812 9.085938 13.070312 9.023438 13.128906 8.964844 C 13.214844 8.878906 13.300781 8.792969 13.386719 8.707031 C 13.410156 8.679688 13.4375 8.65625 13.460938 8.628906 C 13.671875 8.417969 13.871094 8.304688 14.175781 8.304688 C 14.433594 8.3125 14.613281 8.359375 14.796875 8.546875 C 14.980469 8.769531 15.050781 8.988281 15.035156 9.277344 C 14.972656 9.667969 14.660156 9.925781 14.390625 10.195312 C 14.351562 10.234375 14.308594 10.277344 14.265625 10.320312 C 14.152344 10.433594 14.039062 10.546875 13.925781 10.660156 C 13.832031 10.757812 13.734375 10.851562 13.640625 10.945312 C 13.417969 11.171875 13.195312 11.394531 12.96875 11.617188 C 12.738281 11.847656 12.507812 12.082031 12.277344 12.3125 C 12.078125 12.511719 11.878906 12.710938 11.679688 12.90625 C 11.5625 13.027344 11.445312 13.144531 11.328125 13.265625 C 11.214844 13.375 11.105469 13.488281 10.992188 13.597656 C 10.953125 13.636719 10.910156 13.679688 10.871094 13.71875 C 10.445312 14.148438 10.445312 14.148438 10.117188 14.195312 C 10.078125 14.195312 10.042969 14.195312 10.003906 14.195312 C 9.945312 14.199219 9.945312 14.199219 9.890625 14.199219 C 9.511719 14.140625 9.277344 13.871094 9.019531 13.613281 C 8.980469 13.570312 8.9375 13.527344 8.894531 13.484375 C 8.777344 13.371094 8.664062 13.253906 8.550781 13.140625 C 8.429688 13.019531 8.308594 12.898438 8.1875 12.777344 C 7.988281 12.578125 7.785156 12.375 7.582031 12.171875 C 7.351562 11.9375 7.117188 11.703125 6.882812 11.472656 C 6.660156 11.246094 6.433594 11.023438 6.210938 10.796875 C 6.113281 10.703125 6.019531 10.605469 5.921875 10.511719 C 5.808594 10.398438 5.699219 10.285156 5.585938 10.171875 C 5.546875 10.132812 5.503906 10.089844 5.460938 10.050781 C 5.40625 9.992188 5.351562 9.9375 5.292969 9.878906 C 5.261719 9.847656 5.230469 9.816406 5.199219 9.785156 C 5.015625 9.566406 4.953125 9.34375 4.960938 9.0625 C 5.007812 8.800781 5.121094 8.589844 5.339844 8.425781 C 5.558594 8.296875 5.804688 8.277344 6.054688 8.320312 C 6.300781 8.414062 6.472656 8.558594 6.652344 8.746094 C 6.679688 8.773438 6.707031 8.796875 6.734375 8.828125 C 6.820312 8.914062 6.910156 9 6.996094 9.089844 C 7.058594 9.152344 7.117188 9.210938 7.179688 9.273438 C 7.339844 9.433594 7.496094 9.59375 7.65625 9.753906 C 7.820312 9.917969 7.980469 10.082031 8.144531 10.246094 C 8.464844 10.566406 8.78125 10.890625 9.101562 11.210938 C 9.101562 11.164062 9.101562 11.121094 9.101562 11.074219 C 9.105469 9.996094 9.105469 8.917969 9.109375 7.839844 C 9.109375 7.707031 9.113281 7.574219 9.113281 7.441406 C 9.113281 7.414062 9.113281 7.386719 9.113281 7.359375 C 9.113281 6.933594 9.113281 6.503906 9.117188 6.074219 C 9.117188 5.636719 9.117188 5.199219 9.117188 4.757812 C 9.121094 4.511719 9.121094 4.265625 9.121094 4.019531 C 9.121094 3.785156 9.121094 3.554688 9.125 3.324219 C 9.125 3.238281 9.125 3.152344 9.125 3.066406 C 9.125 2.949219 9.125 2.835938 9.125 2.71875 C 9.125 2.683594 9.125 2.652344 9.125 2.617188 C 9.128906 2.316406 9.195312 2.054688 9.414062 1.835938 C 9.796875 1.570312 10.1875 1.578125 10.578125 1.828125 Z M 10.578125 1.828125 " />
										<path style={{
											stroke: "none",
											fillRule: "nonzero",
											fillOpacity: "1"
										}} d="M 2.53125 15.808594 C 2.554688 15.808594 2.582031 15.808594 2.609375 15.808594 C 2.699219 15.808594 2.785156 15.808594 2.875 15.808594 C 2.9375 15.808594 3 15.808594 3.066406 15.808594 C 3.242188 15.808594 3.417969 15.808594 3.589844 15.808594 C 3.78125 15.808594 3.96875 15.808594 4.160156 15.808594 C 4.527344 15.808594 4.898438 15.808594 5.269531 15.808594 C 5.570312 15.808594 5.871094 15.808594 6.171875 15.808594 C 7.027344 15.804688 7.878906 15.804688 8.734375 15.804688 C 8.777344 15.804688 8.824219 15.804688 8.871094 15.804688 C 8.917969 15.804688 8.964844 15.804688 9.011719 15.804688 C 9.757812 15.804688 10.503906 15.804688 11.25 15.804688 C 12.019531 15.804688 12.785156 15.800781 13.550781 15.800781 C 13.980469 15.800781 14.414062 15.800781 14.84375 15.800781 C 15.210938 15.800781 15.574219 15.800781 15.941406 15.800781 C 16.128906 15.800781 16.316406 15.800781 16.503906 15.800781 C 16.675781 15.800781 16.84375 15.800781 17.015625 15.800781 C 17.078125 15.800781 17.140625 15.800781 17.203125 15.800781 C 17.585938 15.796875 17.871094 15.804688 18.15625 16.085938 C 18.3125 16.316406 18.40625 16.550781 18.359375 16.835938 C 18.273438 17.128906 18.117188 17.304688 17.863281 17.464844 C 17.742188 17.511719 17.644531 17.511719 17.511719 17.511719 C 17.484375 17.511719 17.460938 17.511719 17.433594 17.511719 C 17.34375 17.511719 17.253906 17.511719 17.167969 17.511719 C 17.101562 17.511719 17.039062 17.511719 16.972656 17.511719 C 16.796875 17.511719 16.621094 17.511719 16.445312 17.511719 C 16.253906 17.511719 16.066406 17.511719 15.875 17.511719 C 15.460938 17.515625 15.042969 17.515625 14.628906 17.515625 C 14.367188 17.515625 14.109375 17.515625 13.851562 17.515625 C 13.132812 17.515625 12.414062 17.515625 11.695312 17.515625 C 11.648438 17.515625 11.605469 17.515625 11.554688 17.515625 C 11.464844 17.515625 11.371094 17.515625 11.277344 17.515625 C 11.230469 17.515625 11.183594 17.515625 11.136719 17.515625 C 11.066406 17.515625 11.066406 17.515625 10.996094 17.515625 C 10.246094 17.515625 9.496094 17.519531 8.742188 17.519531 C 7.972656 17.519531 7.203125 17.523438 6.433594 17.523438 C 6 17.523438 5.566406 17.523438 5.132812 17.523438 C 4.765625 17.523438 4.398438 17.523438 4.027344 17.523438 C 3.839844 17.523438 3.652344 17.523438 3.464844 17.523438 C 3.292969 17.523438 3.121094 17.523438 2.949219 17.523438 C 2.886719 17.523438 2.824219 17.523438 2.761719 17.523438 C 2.394531 17.527344 2.128906 17.511719 1.855469 17.25 C 1.683594 17.0625 1.621094 16.863281 1.628906 16.609375 C 1.667969 16.332031 1.777344 16.117188 1.996094 15.945312 C 2.175781 15.835938 2.324219 15.808594 2.53125 15.808594 Z M 2.53125 15.808594 " />
									</svg>
								</div>

								<span style={{
									width: 'Calc( 100% - 20px )',
									height: '2px',

									position: 'absolute',
									bottom: '-3px',
									left: '50%',
									transform: 'translate( -50%, 0% )',

									backgroundColor: '#1212124d',
									borderRadius: '1px'
								}}></span>
							</div>
						))}
					</div>
				</div>
				: null}
		</div>
	)
}
