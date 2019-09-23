import React from 'react';
import '@dhis2/d2-ui-core/css/Table.css';
import * as PropTypes from 'prop-types';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import { inject, observer } from "mobx-react";

import Step0 from './program/step0';
import Step1 from './program/step1';
import Step2 from './program/step2';
import Step3 from './program/step3';
import Step4 from './program/step4';
import Step5 from './program/step5';
import Step6 from './program/step6';
import ImportType from "./program/ImportType";

const styles = theme => ({
    button: {
        marginRight: theme.spacing.unit,
    },
    instructions: {
        margin: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
    },
    hidden: {
        display: 'none'
    }
});

@inject('IntegrationStore')
@observer
class Program extends React.Component {
    integrationStore = null;


    constructor(props) {
        super(props);
        const { d2, IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
        this.integrationStore.setD2(d2);
    }

    getStepContent = step => {
        switch (step) {
            case 0:
                return <Step0 />;
            case 1:
                return <Step1 />;
            case 2:
                return <ImportType />;
            case 3:
                return <Step2 />;
            case 4:
                return <Step3 />;
            case 5:
                return <Step4 />;
            case 6:
                return <Step5 />;
            case 7:
                return <Step6 />;
            default:
                return 'Unknown step';
        }
    };

    render() {
        const { classes } = this.props;
        return (<div className={classes.instructions}>
            <Stepper alternativeLabel activeStep={this.integrationStore.activeStep}>
                {this.integrationStore.steps.map((label, index) => {
                    const props = {};
                    const buttonProps = {};

                    return (
                        <Step key={label} {...props}>
                            <StepButton
                                onClick={this.integrationStore.handleStep(index)}
                                completed={this.integrationStore.isStepComplete(index)}
                                {...buttonProps}
                            >
                                {label}
                            </StepButton>
                        </Step>
                    );
                })}
            </Stepper>
            <div style={{ marginBottom: 20 }}>{this.getStepContent(this.integrationStore.activeStep)}</div>
            <table width="100%">
                <tbody>
                    <tr>
                        <td width="33%" align="left">
                            <Button
                                disabled={this.integrationStore.activeStep === 0}
                                onClick={this.integrationStore.handleBack}
                                variant="contained"
                                color="secondary"
                                className={this.integrationStore.activeStep === 0 || this.integrationStore.activeStep >= 7 ? classes.hidden : ''}
                            >
                                Back
                        </Button>
                        </td>
                        <td width="34%" valign="top" align="center">
                            <Button
                                disabled={this.integrationStore.activeStep === 0}
                                onClick={this.integrationStore.handleReset}
                                variant="contained"
                                color="secondary"
                                className={this.integrationStore.activeStep < 2 ? classes.hidden : classes.button}
                            >
                                Cancel
                        </Button>

                            <Button
                                onClick={this.integrationStore.saveMapping}
                                variant="contained"
                                color="primary"
                                className={this.integrationStore.activeStep < 3 ? classes.hidden : classes.button}
                            >
                                Save Mapping
                        </Button>
                        </td>
                        <td width="33%" valign="top" align="right">
                            <Button
                                disabled={this.integrationStore.disableDownload}
                                variant="contained"
                                color="primary"
                                onClick={this.integrationStore.downloadProgramData}
                                className={this.integrationStore.activeStep !== 6 ? classes.hidden : classes.button}
                            >
                                Download Payload
                        </Button>
                            <Button
                                disabled={this.integrationStore.disableNext}
                                variant="contained"
                                color="primary"
                                onClick={this.integrationStore.handleNext}
                                className={this.integrationStore.activeStep === 1 || this.integrationStore.activeStep > 7 ? classes.hidden : classes.button}
                            >
                                {this.integrationStore.nextLabel}
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>);
    }
}

Program.propTypes = {
    d2: PropTypes.object.isRequired,
    classes: PropTypes.object,
};

export default withStyles(styles)(Program);
