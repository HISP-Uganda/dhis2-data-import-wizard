import {inject, observer} from "mobx-react";
import React from "react";
import Dropzone from "react-dropzone";
import {CloudUpload} from "@material-ui/icons";

import {Table, TableBody, TableCell, TableHead, TableRow, withStyles} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Select from "react-select";
import Progress from "./progress";


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
class Organisation extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const {IntegrationStore, d2} = props;
    this.integrationStore = IntegrationStore;
    this.integrationStore.organisation.setD2(d2);
  }

  componentDidMount() {
  }

  render() {
    const {classes} = this.props
    return <div className={classes.padding}>
      <Dropzone activeStyle={{}}
                accept=".csv, .xls, .xlsx"
                onDrop={this.integrationStore.organisation.onDrop}>
        {({getRootProps, getInputProps}) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <br/>
              <p align="center">Drop files here</p>
              <p align="center">
                <CloudUpload fontSize="large"/>
              </p>
              <p align="center">{this.integrationStore.organisation.fileName}</p>
              <p align="center" style={{color: 'red'}}>{this.integrationStore.organisation.uploadMessage}</p>
            </div>
          </section>
        )}
      </Dropzone>


      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name Column</TableCell>
            <TableCell>Short Name Column</TableCell>
            <TableCell>Description Column</TableCell>
            <TableCell>Code Column</TableCell>
            <TableCell>ID Column</TableCell>
            <TableCell>Latitude</TableCell>
            <TableCell>Longitude</TableCell>
            <TableCell>Level</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.integrationStore.organisation.mappings.map((p, i) => <TableRow key={i}>
            <TableCell>
              <Select
                placeholder="Name Column"
                value={p.nameColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setNameColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>
              <Select
                placeholder="Short Name Column"
                value={p.shortNameColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setShortNameColumn}
                isClearable
                isSearchable
              />
            </TableCell>

            <TableCell>
              <Select
                placeholder="Description"
                value={p.descriptionColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setDescriptionColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>
              <Select
                placeholder="Code Column"
                value={p.codeColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setCodeColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>
              <Select
                placeholder="ID Column"
                value={p.idColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setIdColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>
              <Select
                placeholder="Latitude Column"
                value={p.latitudeColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setLatitudeColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>
              <Select
                placeholder="Longitude Column"
                value={p.longitudeColumn}
                options={this.integrationStore.organisation.columns}
                onChange={p.setLongitudeColumn}
                isClearable
                isSearchable
              />
            </TableCell>
            <TableCell>{p.level}</TableCell>
            <TableCell>
              <Button id="deleteBtn" color="secondary"
                      onClick={this.integrationStore.organisation.removeMapping(i)}>REMOVE LEVEL</Button>
            </TableCell>
          </TableRow>)}
          <TableRow>
            <TableCell colSpan={9} align="right">
              <Button id="addBtn" color="primary"
                      onClick={this.integrationStore.organisation.addMapping}>ADD LEVEL</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Button color="primary"
              type="button"
              variant="contained"
              onClick={this.integrationStore.organisation.process}>Process</Button>

      <Progress open={this.integrationStore.organisation.dialogOpen}
                onClose={this.integrationStore.organisation.closeDialog}
                message={this.integrationStore.organisation.message}/>
    </div>
  }
}

export default withStyles(styles)(Organisation);
