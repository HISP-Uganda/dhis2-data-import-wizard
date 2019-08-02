import {inject, observer} from "mobx-react";
import React from "react";
import {withStyles} from "@material-ui/core/styles";
import Table from "@dhis2/d2-ui-table";
import red from '@material-ui/core/colors/red';

import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';

import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import {Delete, ArrowUpward, CloudDownload} from "@material-ui/icons";
import Summary from "./Summary";
import Progress from "../progress";
import D20 from './d20';

const DialogTitle = withStyles(theme => ({
    root: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        margin: 0,
        padding: theme.spacing.unit * 2,
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing.unit,
        top: theme.spacing.unit,
        color: theme.palette.grey[500],
    },
}))(props => {
    const {children, classes, onClose} = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="Close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon/>
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

const DialogContent = withStyles(theme => ({
    root: {
        margin: 0,
        padding: theme.spacing.unit * 2,
    },
}))(MuiDialogContent);

const DialogActions = withStyles(theme => ({
    root: {
        borderTop: `1px solid ${theme.palette.divider}`,
        margin: 0,
        padding: theme.spacing.unit,
    },
}))(MuiDialogActions);

const styles = theme => ({
    icon: {
        margin: theme.spacing.unit * 2
    },
    iconHover: {
        margin: theme.spacing.unit * 2,
        '&:hover': {
            color: red[800]
        }
    },
    hidden: {
        display: 'none'
    }
});


@inject('IntegrationStore')
@observer
class D0 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        this.integrationStore.checkAggregateDataStore();
    }

    render() {
        const {classes} = this.props;
        return <div>
            {this.integrationStore.aggregates.length > 0 ?
                <Table
                    columns={['aggregateId', 'mappingName', 'mappingDescription']}
                    rows={this.integrationStore.aggregates}
                    contextMenuActions={this.integrationStore.tableAggActions}
                    contextMenuIcons={
                        {
                            upload: <ArrowUpward/>,
                            template: <CloudDownload/>,
                            delete: <Delete/>
                        }
                    }
                    primaryAction={this.integrationStore.useSavedAggregate}
                /> : <p style={{textAlign: 'center', fontSize: 15}}>There are no items</p>}

            <Dialog
                fullWidth={true}
                maxWidth={'lg'}
                open={this.integrationStore.uploadData}
                onClose={this.integrationStore.closeUploadDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title" onClose={this.integrationStore.closeUploadDialog}>
                    {"Upload data"}
                </DialogTitle>
                <DialogContent>
                    <D20/>
                    <Summary/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.integrationStore.closeUploadDialog} color="primary">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.integrationStore.dataSet.pullData}
                        className={this.integrationStore.dataSet.canPull ? classes.button : classes.hidden}
                    >
                        Pull Data
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={this.integrationStore.dataSet.disableImport}
                        onClick={this.integrationStore.dataSet.create}>
                        Import
                    </Button>


                </DialogActions>
            </Dialog>
            <Progress open={this.integrationStore.dialogOpen}
                      onClose={this.integrationStore.closeDialog}/>
        </div>
    }
}

export default withStyles(styles)(D0);
