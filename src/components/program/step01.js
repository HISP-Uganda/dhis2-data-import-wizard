import { InputField } from "@dhis2/d2-ui-core";
import Table from "@dhis2/d2-ui-table";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import red from "@material-ui/core/colors/red";
import Dialog from "@material-ui/core/Dialog";
import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
import {
  ArrowDownward,
  ArrowUpward,
  CloudDownload,
  CloudUpload, Delete
} from "@material-ui/icons";
import { inject, observer } from "mobx-react";
import React from "react";
import Dropzone from "react-dropzone";
import Select from "react-select";
import { changeStyle } from "../../utils/data-utils";
import { DialogActions, DialogContent, DialogTitle } from "../Fragments";
import Progress from "../progress";
import EventSummary from "./EventSummary";
import Params from "./Params";
import Summary from "./Summary";


const styles = (theme) => ({
  icon: {
    margin: theme.spacing.unit * 2,
  },
  iconHover: {
    margin: theme.spacing.unit * 2,
    "&:hover": {
      color: red[800],
    },
  },
});

@inject("IntegrationStore")
@observer
class Step0 extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
  }

  componentDidMount() {
    this.integrationStore.checkDataStore();
  }

  render() {
    return (
      <div>
        {this.integrationStore.program.pulling ? (
          <LinearProgress color="secondary" />
        ) : (
          ""
        )}
        {this.integrationStore.mappings.length > 0 ? (
          <Table
            columns={["mappingId", "mappingName", "mappingDescription"]}
            rows={this.integrationStore.mappings}
            contextMenuActions={this.integrationStore.tableActions}
            contextMenuIcons={{
              delete: <Delete />,
              upload: <ArrowUpward />,
              download: <ArrowDownward />,
              template: <CloudDownload />,
            }}
            primaryAction={this.integrationStore.useSaved}
          />
        ) : (
          <div style={{ paddingLeft: 20 }}>
            <h2>Welcome to the data import wizard app</h2>
            <h4>
              This app will help you import data into DHIS2 either from
              excel/csv file or from external system through a REST API
            </h4>
            <h4>You have not created any mapping, to create one</h4>

            <ul>
              <li>Click create new mapping</li>
              <li>Click on the program you want to map</li>
              <li>
                On the import type page enter name and description of the
                mapping.
              </li>
              <li>Select import type</li>
              <li>
                If you selected Excel/CSV listing, upload or drag and drop the
                excel/csv file, otherwise
                <br />
                Enter URL and/or username and password to the external system
                API in the provided fields. You also add any parameters if
                applicable
              </li>
            </ul>
          </div>
        )}

        <Dialog
          fullWidth={true}
          maxWidth={"lg"}
          open={this.integrationStore.uploadData}
          onClose={this.integrationStore.closeUploadDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title"
            onClose={this.integrationStore.closeUploadDialog}
          >
            {"Upload Excel/CSV"}
          </DialogTitle>
          <DialogContent>
            <Dropzone
              accept=".csv, .xls, .xlsx"
              onDrop={this.integrationStore.program.onDrop}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <br />
                    <p align="center">Drop files here</p>
                    <p align="center">
                      <CloudUpload fontSize="large" />
                    </p>
                    <p align="center">
                      {this.integrationStore.program.fileName}
                    </p>
                    <p align="center" style={{ color: "red" }}>
                      {this.integrationStore.program.uploadMessage}
                    </p>
                  </div>
                </section>
              )}
            </Dropzone>

            {this.integrationStore.program.fetchingEntities === 1 &&
            this.integrationStore.program.isTracker ? (
              <CircularProgress color="secondary" />
            ) : (
              ""
            )}

            <Select
              placeholder="Select sheet"
              value={this.integrationStore.program.selectedSheet}
              options={this.integrationStore.program.sheets}
              onChange={this.integrationStore.program.setSelectedSheet}
              isClearable
              isSearchable
              styles={changeStyle(this.integrationStore.program.selectedSheet)}
            />
            <br />
            {this.integrationStore.program.isTracker ? (
              <Summary displayResponse={true} />
            ) : (
              <EventSummary displayResponse={true} />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.integrationStore.closeUploadDialog}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={
                this.integrationStore.program.disableCreate ||
                this.integrationStore.program.fetchingEntities === 1
              }
              onClick={this.integrationStore.program.create}
            >
              {this.integrationStore.program.displayProgress ? (
                <CircularProgress size={24} thickness={4} color="secondary" />
              ) : (
                "Import"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          fullWidth={true}
          maxWidth={"lg"}
          open={this.integrationStore.importData}
          onClose={this.integrationStore.closeImportDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title"
            onClose={this.integrationStore.closeImportDialog}
          >
            {"Import data from API"}
          </DialogTitle>
          <DialogContent>
            <table width="100%">
              <tbody>
                <tr>
                  <td width="50%" colSpan={2}>
                    <InputField
                      label="URL"
                      type="text"
                      fullWidth
                      value={this.integrationStore.program.url}
                      onChange={(value) =>
                        this.integrationStore.program.handelURLChange(value)
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td width="50%">
                    <InputField
                      label="Username"
                      type="text"
                      fullWidth
                      value={this.integrationStore.program.username}
                      onChange={(value) =>
                        this.integrationStore.program.setUsername(value)
                      }
                    />
                  </td>
                  <td width="50%">
                    <InputField
                      label="Password"
                      type="text"
                      fullWidth
                      value={this.integrationStore.program.password}
                      onChange={(value) =>
                        this.integrationStore.program.setPassword(value)
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <Params />
            <br />
            {this.integrationStore.program.isTracker ? (
              <Summary displayResponse={true} />
            ) : (
              <EventSummary displayResponse={true} />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.integrationStore.closeImportDialog}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!this.integrationStore.program.url}
              onClick={this.integrationStore.program.pullData}
            >
              Pull Data
            </Button>

            <Button
              variant="contained"
              color="primary"
              disabled={
                this.integrationStore.program.disableCreate ||
                this.integrationStore.program.fetchingEntities === 1
              }
              onClick={this.integrationStore.program.create}
            >
              {this.integrationStore.program.displayProgress ? (
                <CircularProgress size={24} thickness={4} color="secondary" />
              ) : (
                "Import"
              )}
            </Button>
          </DialogActions>
        </Dialog>
        <Progress
          open={
            this.integrationStore.isProgram
              ? this.integrationStore.program.dialogOpen
              : this.integrationStore.dialogOpen
          }
          onClose={
            this.integrationStore.isProgram
              ? this.integrationStore.program.closeDialog
              : this.integrationStore.closeDialog
          }
          message={
            this.integrationStore.isProgram
              ? this.integrationStore.program.message
              : this.integrationStore.message
          }
        />
      </div>
    );
  }
}

export default withStyles(styles)(Step0);
