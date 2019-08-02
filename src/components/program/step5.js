import React from "react";
import {withStyles} from "@material-ui/core/styles";

import {inject, observer} from "mobx-react";
import Summary from "./Summary";
import {NotificationManager} from "react-notifications";
import Progress from "../progress";
import EventSummary from "./EventSummary";

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
class Step5 extends React.Component {

    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        const imports = this.integrationStore.program.totalImports;
        if (imports === 0) {
            NotificationManager.info(`Importer could not find what to import or update, records might be upto date. Click next to save mapping`, 'Information', 10000);
        }
    }

    render() {
        return (
            <div>
                {this.integrationStore.program.isTracker ? <Summary displayResponse={false}/> :
                    <EventSummary displayResponse={false}/>}
                <Progress open={this.integrationStore.program.dialogOpen}
                          onClose={this.integrationStore.program.closeDialog} message={this.integrationStore.program.message}/>
            </div>


        );
    }
}

export default withStyles(styles)(Step5);
