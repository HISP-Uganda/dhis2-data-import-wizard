import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Select from "react-select";
import FormHelperText from "@material-ui/core/FormHelperText";

import red from "@material-ui/core/colors/red";
import { inject, observer } from "mobx-react";
import { InputField } from "@dhis2/d2-ui-core";
import FormGroup from "@material-ui/core/FormGroup";
import Grid from "@material-ui/core/Grid";
import Progress from "../progress";

import Table from "@material-ui/core/Table";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { GreenCheckbox } from "../common";
import { Clear, Done } from "@material-ui/icons";
import { changeStyle } from "../../utils/data-utils";

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
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
class Step2 extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
  }

  componentDidMount() {
    if (
      this.integrationStore.program.templateType &&
      this.integrationStore.program.templateType.value === "2"
    ) {
      if (this.integrationStore.program.isDHIS2) {
        this.integrationStore.program.computeUnits();
      } else {
        this.integrationStore.program.pullData();
      }
    }
  }

  attribution = () => {
    if (this.integrationStore.program.categories.length > 0) {
      return (
        <Grid container spacing={8}>
          {this.integrationStore.program.categoryCombo.categories.map(
            (category) => {
              return (
                <Grid
                  key={category.id}
                  item
                  xs={
                    12 /
                    this.integrationStore.program.categoryCombo.categories
                      .length
                  }
                >
                  <span style={{ fontWeight: "bold" }}>
                    {category.name + " column"}
                  </span>
                  <Select
                    placeholder={category.name + " column"}
                    isClearable
                    isSearchable
                    value={category.mapping}
                    options={this.integrationStore.program.columns}
                    onChange={category.setMapping}
                    styles={changeStyle(category.mapping)}
                  />
                </Grid>
              );
            }
          )}
        </Grid>
      );
    }
    return null;
  };

  organisationUnitMapping = () => {
    return (
      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Source Organisation Units</TableCell>
              <TableCell>Destination Organisation Units</TableCell>
              <TableCell style={{ width: 40 }}>Mapped?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.integrationStore.sourceProgramUnits.map((u, i) => (
              <TableRow hover key={i}>
                <TableCell>{u.name}</TableCell>
                <TableCell>
                  <Select
                    placeholder="Select unit"
                    value={u.mapping}
                    options={this.integrationStore.program.organisationUnits.map(
                      (ui) => {
                        return { label: ui.name, value: ui.id };
                      }
                    )}
                    onChange={u.setMapping}
                    isClearable
                    isSearchable
                    styles={changeStyle(u.mapping)}
                  />
                </TableCell>
                <TableCell>{u.mapping ? <Done /> : <Clear />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={this.integrationStore.program.sourceOrganisationUnits.length}
          rowsPerPage={this.integrationStore.paging["step25"]["rowsPerPage"]}
          page={this.integrationStore.paging["step25"]["page"]}
          backIconButtonProps={{
            "aria-label": "Previous Page",
          }}
          nextIconButtonProps={{
            "aria-label": "Next Page",
          }}
          onChangePage={this.integrationStore.handleChangeElementPage("step25")}
          onChangeRowsPerPage={this.integrationStore.handleChangeElementRowsPerPage(
            "step25"
          )}
        />
      </div>
    );
  };

  render() {
    return (
      <div>
        {this.integrationStore.program.templateType.value === "1" ? (
          <div>
            <Grid container spacing={8}>
              <Grid item xs={12}>
                <span style={{ fontWeight: "bold" }}>Select sheet</span>
                <Select
                  placeholder="Select sheet"
                  isClearable
                  isSearchable
                  value={this.integrationStore.program.selectedSheet}
                  options={this.integrationStore.program.sheets}
                  onChange={this.integrationStore.program.setSelectedSheet}
                  styles={changeStyle(
                    this.integrationStore.program.selectedSheet
                  )}
                />
              </Grid>
            </Grid>
            <Grid container spacing={8}>
              <Grid item xs={6}>
                <InputField
                  label="Header row"
                  type="number"
                  fullWidth
                  value={this.integrationStore.program.headerRow}
                  onChange={(value) =>
                    this.integrationStore.program.handelHeaderRowChange(value)
                  }
                />
              </Grid>

              <Grid item xs={6}>
                <InputField
                  label="Data value start row"
                  type="number"
                  fullWidth
                  value={this.integrationStore.program.dataStartRow}
                  onChange={(value) =>
                    this.integrationStore.program.handelDataRowStartChange(
                      value
                    )
                  }
                />
              </Grid>
            </Grid>
          </div>
        ) : null}
        <br />
        {!this.integrationStore.program.isDHIS2 && (
          <Grid container spacing={8}>
            <Grid item xs={12}>
              <span style={{ fontWeight: "bold" }}>
                Select organisation unit column
              </span>
              <Select
                placeholder="Organisation unit column"
                isClearable
                isSearchable
                value={this.integrationStore.program.orgUnitColumn}
                options={this.integrationStore.program.columns}
                onChange={
                  this.integrationStore.program.handleOrgUnitSelectChange
                }
                styles={changeStyle(
                  this.integrationStore.program.orgUnitColumn
                )}
              />
              <FormHelperText>
                For new tracked entities and events, this column will be used as
                organisation unit
              </FormHelperText>
            </Grid>
          </Grid>
        )}

        <br />
        <span style={{ fontWeight: "bold" }}>Organisation unit mapping</span>
        {this.organisationUnitMapping()}
        <br />
        {this.attribution()}
        <br />
        {this.integrationStore.program.isTracker ? (
          <Grid container spacing={8}>
            <Grid item xs={12}>
              <Grid container spacing={8}>
                <Grid item xs={12}>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <GreenCheckbox
                          disabled={!this.integrationStore.program.isTracker}
                          checked={this.integrationStore.program.createEntities}
                          onChange={
                            this.integrationStore.program
                              .handleCreateEntitiesCheck
                          }
                          value="3"
                        />
                      }
                      label="Create new entities"
                    />
                    <FormControlLabel
                      control={
                        <GreenCheckbox
                          disabled={!this.integrationStore.program.isTracker}
                          checked={this.integrationStore.program.updateEntities}
                          onChange={
                            this.integrationStore.program
                              .handleUpdateEntitiesCheck
                          }
                          value="4"
                        />
                      }
                      label="Update entities"
                    />
                    <FormControlLabel
                      control={
                        <GreenCheckbox
                          disabled={!this.integrationStore.program.isTracker}
                          checked={
                            this.integrationStore.program.createNewEnrollments
                          }
                          onChange={
                            this.integrationStore.program
                              .handleCreateNewEnrollmentsCheck
                          }
                          value="5"
                        />
                      }
                      label="Create new enrollments"
                    />
                    <FormControlLabel
                      control={
                        <GreenCheckbox
                          disabled={!this.integrationStore.program.isTracker}
                          checked={
                            this.integrationStore.program.incidentDateProvided
                          }
                          onChange={
                            this.integrationStore.program
                              .handleIncidentDateProvidedCheck
                          }
                          value="5"
                        />
                      }
                      label="Incident Date Provided"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
              {this.integrationStore.program.createNewEnrollments ? (
                <Grid container spacing={8}>
                  <Grid item xs={12}>
                    <Grid container spacing={8}>
                      <Grid
                        item
                        xs={
                          this.integrationStore.program.incidentDateProvided
                            ? 6
                            : 12
                        }
                      >
                        <span style={{ fontWeight: "bold" }}>
                          Select enrollment date column
                        </span>
                        <Select
                          placeholder="Enrollment date column"
                          isClearable
                          isSearchable
                          value={
                            this.integrationStore.program.enrollmentDateColumn
                          }
                          disabled={
                            !this.integrationStore.program.createNewEnrollments
                          }
                          options={this.integrationStore.program.columns}
                          onChange={
                            this.integrationStore.program
                              .handleEnrollmentDateColumnSelectChange
                          }
                          styles={changeStyle(
                            this.integrationStore.program.enrollmentDateColumn
                          )}
                        />
                        <FormHelperText>
                          Should be a valid date
                          <br />
                          &nbsp;
                        </FormHelperText>
                      </Grid>

                      {this.integrationStore.program.incidentDateProvided ? (
                        <Grid item xs={6}>
                          <span style={{ fontWeight: "bold" }}>
                            Select incident date column
                          </span>
                          <Select
                            placeholder="Incident date column"
                            isClearable
                            isSearchable
                            value={
                              this.integrationStore.program.incidentDateColumn
                            }
                            disabled={
                              !this.integrationStore.program
                                .createNewEnrollments
                            }
                            options={this.integrationStore.program.columns}
                            onChange={
                              this.integrationStore.program
                                .handleIncidentDateColumnSelectChange
                            }
                            styles={changeStyle(
                              this.integrationStore.program.incidentDateColumn
                            )}
                          />
                          <FormHelperText>
                            Should be a valid date
                            <br />
                            &nbsp;
                          </FormHelperText>
                        </Grid>
                      ) : null}
                    </Grid>
                  </Grid>
                </Grid>
              ) : null}
            </Grid>
          </Grid>
        ) : null}
        <Progress
          open={this.integrationStore.program.dialogOpen}
          onClose={this.integrationStore.program.closeDialog}
        />
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(Step2);
