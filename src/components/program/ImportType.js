import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { InputField } from "@dhis2/d2-ui-core";
import Dropzone from "react-dropzone";
import Select from "react-select";
import Params from "./Params";

import { CloudUpload } from "@material-ui/icons";
import Progress from "../progress";
import { changeStyle } from "../../utils/data-utils";



const styles = theme => ({
    root: {
        display: 'flex',
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    }
});

const items = [
    { label: 'Excel/CSV Listing', value: "1" },
    { label: 'Other Systems via API (REST)', value: "2" },
];


@inject('IntegrationStore')
@observer
class ImportType extends React.Component {

    integrationStore = null;

    state = {
        value: null,
    };

    handleChange = event => {
        this.setState({ value: event.target.value });
    };

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }

    apiDataSource = () => {
        return <div>
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    <InputField
                        required
                        label="URL*"
                        type="text"
                        fullWidth
                        value={this.integrationStore.program.url}
                        onChange={(value) => this.integrationStore.program.handelURLChange(value)} />
                </Grid>
            </Grid>

            <Grid container spacing={8}>
                <Grid item xs={6}>
                    <InputField
                        label="Username"
                        type="text"
                        fullWidth
                        value={this.integrationStore.program.username}
                        onChange={(value) => this.integrationStore.program.setUsername(value)} />
                </Grid>
                <Grid item xs={6}>
                    <InputField
                        label="Password"
                        type="text"
                        fullWidth
                        value={this.integrationStore.program.password}
                        onChange={(value) => this.integrationStore.program.setPassword(value)} />
                </Grid>
            </Grid>

            <Params />
        </div>
    };

    upload = () => {
        return <Dropzone accept=".csv, .xls, .xlsx" onDrop={this.integrationStore.program.onDrop}>

            {({ getRootProps, getInputProps }) => (
                <section>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <br />
                        <p align="center">Drop files here</p>
                        <p align="center">
                            <CloudUpload fontSize="large" />
                        </p>
                        <p align="center">{this.integrationStore.program.fileName}</p>
                        <p align="center" style={{ color: 'red' }}>{this.integrationStore.program.uploadMessage}</p>
                    </div>
                </section>
            )}

        </Dropzone>
    };

    render() {
        return <div>
            <Grid container>
                <Grid item xs={12}>
                    <InputField
                        label="Mapping Name"
                        type="text"
                        fullWidth
                        value={this.integrationStore.program.mappingName}
                        onChange={(value) => this.integrationStore.program.handleMappingNameChange(value)}
                    />
                    <InputField
                        label="Mapping Description"
                        type="text"
                        multiline
                        fullWidth
                        value={this.integrationStore.program.mappingDescription}
                        onChange={(value) => this.integrationStore.program.handleMappingDescriptionChange(value)}
                    />
                    <br />
                    <br />
                    <span style={{ fontWeight: 'bold' }}>Select import type</span>
                    <Select
                        placeholder="Import Type"
                        value={this.integrationStore.program.templateType}
                        options={items}
                        onChange={this.integrationStore.handleTemplateTypeChange}
                        isClearable
                        isSearchable
                        styles={changeStyle(this.integrationStore.program.templateType)}
                    />
                </Grid>
            </Grid>

            <Grid container>
                <Grid item xs={12}>
                    {this.integrationStore.program.templateType ? this.integrationStore.program.templateType.value === '1' ? this.upload() : this.apiDataSource() : null}
                </Grid>
            </Grid>

            <Progress open={this.integrationStore.program.dialogOpen}
                onClose={this.integrationStore.program.closeDialog} message={"Uploading..."} />
        </div>


    }

}

export default withStyles(styles)(ImportType);

