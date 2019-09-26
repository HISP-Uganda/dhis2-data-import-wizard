import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import ImportSummary from './ImportSummary';

import Progress from "../progress";

const styles = theme => ({
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: `0 ${theme.spacing.unit * 2}px`,
    },
});
@inject('IntegrationStore')
@observer
class D5 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        this.integrationStore.dataSet.create();
    }

    render() {
        return <div>
            <ImportSummary />

            <Progress open={this.integrationStore.dataSet.dialogOpen}
                onClose={this.integrationStore.dataSet.closeDialog} message={this.integrationStore.dataSet.message} />
        </div>
    }

}

export default withStyles(styles)(D5);
