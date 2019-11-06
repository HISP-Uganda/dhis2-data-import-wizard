import { Button } from "antd";
import React from "react";
import { inject, observer } from "mobx-react";
import PeriodSelectorDialog from '@dhis2/d2-ui-period-selector-dialog';

@inject('IntegrationStore')
@observer
class PeriodDialog extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }
    render() {
        return (
            <div>
                <div style={{ paddingRight: 10 }}>
                    <Button size="large" htmlType="button" type="primary" onClick={this.integrationStore.dataSet.togglePeriodDialog}>Select period</Button>
                </div>
                <PeriodSelectorDialog
                    open={this.integrationStore.dataSet.dialogOpened}
                    onClose={this.integrationStore.dataSet.onClose}
                    onUpdate={this.integrationStore.dataSet.onUpdate}
                    selectedItems={this.integrationStore.dataSet.selectedPeriods}
                    onReorder={this.integrationStore.dataSet.onReorder}
                    onSelect={this.integrationStore.dataSet.setSelectedPeriods}
                    onDeselect={this.integrationStore.dataSet.onDeselect}
                />

            </div>
        );
    }
}


export default PeriodDialog;
