import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import *  as PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import D4 from "./d4";
import ImportSummary from './ImportSummary';

const styles = theme => ({
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: `0 ${theme.spacing.unit * 2}px`,
    },
    root: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    }
});

function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};


@inject('IntegrationStore')
@observer
class SummaryPage extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
        this.state = {
            value: this.integrationStore.dataSet.isDhis2 ? 1 : 0,
        };
    }

    render() {
        const { classes } = this.props;
        return <div className={classes.root}>
            {this.integrationStore.dataSet.isDhis2 ? <ImportSummary /> : this.integrationStore.dataSet.processed ? <D4 /> : <div></div>}
        </div>
    }

}

export default withStyles(styles)(SummaryPage);
