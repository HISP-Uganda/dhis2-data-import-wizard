import React from 'react';
import '@dhis2/d2-ui-core/css/Table.css';
import * as PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {inject, observer} from "mobx-react";
import Button from "@material-ui/core/Button";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepButton from "@material-ui/core/StepButton";
import D0 from "./aggregate/d0";
import D1 from "./aggregate/d1";
import D2 from "./aggregate/d2";
import D3 from "./aggregate/d3";
import D4 from "./aggregate/d4";
import D5 from "./aggregate/d5";
import ImportType from "./aggregate/ImportType";

const styles = theme => ({
    button: {
        marginRight: theme.spacing.unit,
    },
    instructions: {
        margin: theme.spacing.unit,
        // marginBottom: theme.spacing.unit,
    },
    space: {
        marginLeft: '5px;'
    },
    hidden: {
        display: 'none'
    }
});

@inject('IntegrationStore')
@observer
class Aggregate extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {d2, IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
        this.integrationStore.setD2(d2);
    }

    getStepContent = step => {
        switch (step) {
            case 0:
                return <D0/>;
            case 1:
                return <D1/>;
            case 2:
                return <ImportType/>;
            case 3:
                return <D2 displayFull={true}/>;
            case 4:
                return <D3/>;
            case 5:
                return <D4/>;
            case 6:
                return <D5/>;
            default:
                return 'Unknown step';
        }
    };

    render() {

        const {classes} = this.props;
        return (
            <div>

                <Stepper alternativeLabel activeStep={this.integrationStore.activeAggregateStep}>
                    {this.integrationStore.aggregateSteps.map((label, index) => {
                        const props = {};
                        const buttonProps = {};

                        return (
                            <Step key={label} {...props}>
                                <StepButton
                                    onClick={this.integrationStore.handleAggregateStep(index)}
                                    completed={this.integrationStore.isAggregateStepComplete(index)}
                                    {...buttonProps}
                                >
                                    {label}
                                </StepButton>
                            </Step>
                        );
                    })}
                </Stepper>

                <div className={classes.instructions}>
                    <div
                        style={{marginBottom: 20}}>{this.getStepContent(this.integrationStore.activeAggregateStep)}</div>
                    <table width="100%">
                        <tbody>
                        <tr>
                            <td width="33%" align="left">
                                <Button
                                    disabled={this.integrationStore.activeAggregateStep === 0}
                                    onClick={this.integrationStore.handleAggregateBack}
                                    variant="contained"
                                    color="secondary"
                                    className={this.integrationStore.activeAggregateStep === 0 || this.integrationStore.activeAggregateStep >= 6 ? classes.hidden : classes.button}
                                >
                                    Back
                                </Button>
                            </td>
                            <td width="34%" valign="top" align="center">
                                <Button
                                    disabled={this.integrationStore.activeAggregateStep === 0}
                                    onClick={this.integrationStore.handleResetAggregate}
                                    variant="contained"
                                    color="secondary"
                                    className={this.integrationStore.activeAggregateStep < 2 ? classes.hidden : classes.button}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={this.integrationStore.saveAggregate}
                                    className={this.integrationStore.activeAggregateStep < 3 ? classes.hidden : classes.button}
                                >
                                    Save Mapping
                                </Button>
                            </td>
                            <td width="33%" valign="top" align="right">
                                <Button
                                    disabled={this.integrationStore.disableNextAggregate}
                                    variant="contained"
                                    color="primary"
                                    onClick={this.integrationStore.downloadAggregateData}
                                    className={this.integrationStore.activeAggregateStep !== 5 ? classes.hidden : classes.button}
                                >
                                    Download Payload
                                </Button>
                                <Button
                                    disabled={this.integrationStore.disableNextAggregate}
                                    variant="contained"
                                    color="primary"
                                    onClick={this.integrationStore.handleNextAggregate}
                                    className={this.integrationStore.activeAggregateStep === 1 || this.integrationStore.activeAggregateStep > 7 ? classes.hidden : classes.button}
                                >
                                    {this.integrationStore.nextAggregateLabel}
                                </Button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

Aggregate.propTypes = {
    d2: PropTypes.object.isRequired,
    classes: PropTypes.object,
};

export default withStyles(styles)(Aggregate);
