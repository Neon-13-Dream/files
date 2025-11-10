/** @jsx jsx */
import {
	jsx, Immutable,
	DataSourceTypes
} from 'jimu-core'

import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting(props: AllWidgetSettingProps<any>) {
	const saveHandler = (useDataSources: any[]) => {
		props.onSettingChange({
			id: props.id,
			useDataSources: useDataSources
		})
	}

	return (
		<div style={{
			padding: "15px"
		}}>
			<h4 style={{
				textAlign: "center",
				color: "#fff"
			}}>
				Select Ecology(Chiqindi) feature layer
			</h4>
			<DataSourceSelector
				mustUseDataSource
				types={Immutable([DataSourceTypes.FeatureLayer])}
				useDataSources={props.useDataSources}
				onChange={saveHandler}
				widgetId={props.id}
			/>
		</div>
	)
}
