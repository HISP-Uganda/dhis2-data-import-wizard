import {action, observable} from "mobx";
import _ from 'lodash';

class CategoryOptionCombo {
    @observable id;
    @observable name;
    @observable categoryOptions = [];
    @observable mapping = {};
    @observable dataElement;
    @observable cell = {};
    @observable column = {};
    @action setId = val => this.id = val;
    @action setName = val => this.name = val;
    @action setCell = val => this.cell = val;
    @action setMapping = val => this.mapping = val;
    @action setColumn = val => this.column = val;
    @action setCategoryOptions = val => this.categoryOptions = val;
    @action setCellAll = de => val => {
        if (val) {
            const obj = _.fromPairs([[de.id, val]]);
            const c = {...this.cell, ...obj};
            this.setCell(c);
        } else {
            const final = _.omit(this.cell, [de.id]);
            this.setCell(final);
        }
    };

    @action setMappingAll = de => val => {
        if (val) {
            const obj = _.fromPairs([[de.id, val]]);
            const c = {...this.mapping, ...obj};
            this.setMapping(c);
        } else {
            const final = _.omit(this.mapping, [de.id]);
            this.setMapping(final);
        }
    };

    @action setColumnAll = de => val => {
        if (val) {
            const obj = _.fromPairs([[de.id, val]]);
            const c = {...this.column, ...obj};
            this.setColumn(c);
        } else {
            const final = _.omit(this.column, [de.id]);
            this.setColumn(final);
        }
    };
}

export default CategoryOptionCombo;
