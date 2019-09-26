import { inject, observer } from 'mobx-react';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { PeriodPicker } from "@dhis2/d2-ui-core";
import Select from 'react-select';
import Checkbox from "@material-ui/core/Checkbox";
import TextField from '@material-ui/core/TextField';
import { createParam } from '../../stores/converters'
import Grid from "@material-ui/core/Grid";
import Dropzone from "react-dropzone";
import Params from "./Params";
import { CloudUpload } from "@material-ui/icons";
import customStyles from '../customStyles'

const styles = theme => ({
    block: {
        display: 'block',
        overflow: 'auto'
    },
    table: {
        // marginBottom:10 856177
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        // margin: `${theme.spacing.unit}px 0`,
        width: 'auto',
        height: 'auto',
        display: 'flex',
        flexWrap: 'nowrap',
        flexDirection: 'row',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
});


@inject('IntegrationStore')
@observer
class D20 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }

    upload = () => {
        return <Grid container spacing={8}>
            <Grid item xs={12}>
                <Dropzone activeStyle={{}}
                    accept=".csv, .xls, .xlsx"
                    onDrop={this.integrationStore.dataSet.onDrop}>
                    {({ getRootProps, getInputProps }) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <br />
                                <p align="center">Drop files here</p>
                                <p align="center">
                                    <CloudUpload fontSize="large" />
                                </p>
                                <p align="center">{this.integrationStore.dataSet.fileName}</p>
                                <p align="center" style={{ color: 'red' }}>{this.integrationStore.dataSet.uploadMessage}</p>
                            </div>
                        </section>
                    )}
                </Dropzone>
                <br />
                <Select
                    placeholder="Select sheet"
                    value={this.integrationStore.dataSet.selectedSheet}
                    options={this.integrationStore.dataSet.sheets}
                    onChange={this.integrationStore.dataSet.setSelectedSheet}
                    isClearable
                    isSearchable
                    styles={customStyles}
                />
                <br />
                {!this.integrationStore.dataSet.organisationUnitInExcel && this.integrationStore.dataSet.templateType.value === '3' ?
                    <Select
                        placeholder="Select organisation unit"
                        value={this.integrationStore.dataSet.organisation}
                        options={this.integrationStore.dataSet.organisations}
                        onChange={this.integrationStore.dataSet.setOrganisation}
                        isClearable
                        isSearchable
                        styles={customStyles}
                    /> : null}
                {this.integrationStore.dataSet.templateType.value === '3' && this.integrationStore.dataSet.categoryCombo.categories.length ?
                    <Grid container spacing={8}>
                        {this.integrationStore.dataSet.categoryCombo.categories.map(category => {
                            return <Grid key={category.id} item
                                xs={12 / this.integrationStore.dataSet.categoryCombo.categories.length}>

                                <Select
                                    placeholder={category.name + ' column'}
                                    value={category.mapping}
                                    options={category.options}
                                    onChange={category.setMapping}
                                    isClearable
                                    isSearchable
                                    styles={customStyles}
                                />
                            </Grid>
                        })}
                    </Grid> : null}

                {!this.integrationStore.dataSet.periodInExcel && this.integrationStore.dataSet.templateType.value === '3' ?
                    <PeriodPicker
                        periodType={this.integrationStore.dataSet.periodType}
                        onPickPeriod={(value) => this.integrationStore.dataSet.pick(value)}
                    /> : null}
            </Grid>
        </Grid>
    };


    dhis2 = () => {
        return <Grid container spacing={8}>
            <Grid item xs={12}>
                <Checkbox checked={this.integrationStore.dataSet.multiplePeriods}
                    onChange={this.integrationStore.dataSet.onCheckMultiplePeriods}
                    value="checked" /> Multiple Periods

                {this.integrationStore.dataSet.multiplePeriods ? <div>
                    <Grid container spacing={8}>
                        <Grid item xs={6}>
                            <TextField
                                id="startDate"
                                label="Start Date"
                                type="date"
                                value={this.integrationStore.dataSet.startPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.integrationStore.dataSet.handleStartPeriodChange}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                id="endDate"
                                label="End Date"
                                type="date"
                                value={this.integrationStore.dataSet.endPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.integrationStore.dataSet.handleEndPeriodChange}
                            />
                        </Grid>
                    </Grid>
                    <br />
                </div> : <div>
                        <PeriodPicker
                            periodType={this.integrationStore.dataSet.periodType}
                            onPickPeriod={(value) => this.integrationStore.dataSet.replaceParamByValue(createParam({
                                param: 'dimension',
                                value: `pe:${value}`
                            }), 'pe:')}
                        />
                    </div>}
            </Grid>
        </Grid>
    };

    step2Form = () => {
        switch (this.integrationStore.dataSet.templateType.value) {
            case '4':
            case '5':
                return this.dhis2();
            case '6':
                return <Params />;
            default:
                return this.upload();
        }
    };

    render() {
        return (
            <div>
                {this.step2Form()}
                {/* <Progress open={this.integrationStore.dataSet.dialogOpen}
                    onClose={this.integrationStore.dataSet.closeDialog} /> */}
            </div>
        );
    }
}

export default withStyles(styles)(D20);
