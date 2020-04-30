import {action, observable} from 'mobx';
import _ from 'lodash';
import {NotificationManager} from 'react-notifications';
import XLSX from 'xlsx';
import OrganisationWorker from 'workerize-loader?inline!./Workers'; // eslint-disable-line import/no-webpack-loader-syntax
import Mapping from './Mapping';

let instance = new OrganisationWorker();

class Organisation {

  @observable mappings = [];
  @observable data;
  @observable dialogOpen = false;
  @observable fileName = '';
  @observable columns = [];
  @observable d2;
  @observable message;

  @action setD2 = val => this.d2 = val;
  @action setMappings = val => this.mappings = val;
  @action setDialogOpen = val => this.dialogOpen = val;
  @action setFileName = val => this.fileName = val;
  @action setColumns = val => this.columns = val;
  @action setData = val => this.data = val;
  @action openDialog = () => this.setDialogOpen(true);
  @action closeDialog = () => this.setDialogOpen(false);
  @action addMapping = () => {
    const mapping = new Mapping();
    mapping.setLevel(this.mappings.length + 1)
    this.mappings = [...this.mappings, mapping]
  };

  @action removeMapping = i => () => {
    const current = [...this.mappings.slice(0, i), ...this.mappings.slice(i + 1)];
    this.setMappings(current);
  };

  @action
  onDrop = async (accepted, rejected) => {
    if (accepted.length > 0) {
      this.openDialog();
      this.message = 'Uploading';
      const f = accepted[0];
      this.setFileName(f.name);
      const workbook = await instance.expensive(accepted);

      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        range: 0,
        dateNF: 'YYYY-MM-DD'
      });

      const columns = _.keys(data[0]).map(v => {
        return {value: v, label: v}
      });
      this.setColumns(columns);
      this.setData(data);
      this.closeDialog();
    } else if (rejected.length > 0) {
      NotificationManager.error('Only XLS, XLSX and CSV are supported', 'Error', 5000);
    }
  };

  renameKeys = (keysMap, obj) => {
    return Object.keys(obj).reduce((acc, key) => {
      const renamedObject = {
        [keysMap[key] || key]: obj[key]
      };
      return {
        ...acc,
        ...renamedObject
      };
    }, {});
  };

  @action process = async () => {
    this.openDialog();
    this.message = 'Processing';
    const openingDate = new Date(1990, 1, 1).toISOString();
    if (this.data && this.mappings.length > 0) {
      let processed = {};
      this.mappings.forEach(v => {
        let keys = {};
        if (v.idColumn) {
          keys = {...keys, [v.idColumn.value]: 'id'}
        }
        if (v.nameColumn) {
          keys = {...keys, [v.nameColumn.value]: 'name'}
        }
        if (v.shortNameColumn) {
          keys = {...keys, [v.shortNameColumn.value]: 'shortName'}
        }
        if (v.descriptionColumn) {
          keys = {...keys, [v.descriptionColumn.value]: 'description'}
        }
        if (v.codeColumn) {
          keys = {...keys, [v.codeColumn.value]: 'code'}
        }
        if (v.latitudeColumn) {
          keys = {...keys, [v.latitudeColumn.value]: 'latitude'}
        }

        if (v.longitudeColumn) {
          keys = {...keys, [v.longitudeColumn.value]: 'longitude'}
        }

        if (v.level > 1) {
          const prev = processed[v.level - 1];
          const inverted = _.invert(prev.keys);
          const id = inverted.id;
          const name = inverted.name;
          if (id) {
            keys = {...keys, [id]: 'parent'};
          } else if (name) {
            keys = {...keys, [name]: 'parent'};
          }
        }
        const vals = _.keys(keys);
        let data = this.data.map(d => {
          const obj = _.pick(d, vals);
          let val = this.renameKeys(keys, obj);
          if (val.parent) {
            val = {...val, parent: {id: val.parent}}
          }
          if (!val.shortName) {
            val = {...val, shortName: val.name}
          }
          if (!val.openingDate) {
            val = {...val, openingDate}
          }
          return val
        });
        data = _.uniqWith(data, _.isEqual);
        processed = {...processed, [v.level]: {data, keys}}
      });

      const api = this.d2.Api.getApi();

      const keys = _.sortBy(_.keys(processed));
      this.message = 'Finished processing';

      this.message = 'Inserting';

      for (const k of keys) {
        const current = processed[k];
        const response = await api.post('metadata', {organisationUnits: current.data});
        console.log(response);

      }
      this.closeDialog();

    }
  }
}

export default Organisation;
