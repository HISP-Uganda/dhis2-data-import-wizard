import { action, observable } from "mobx";

import _ from 'lodash';

class Element {
  @observable id;
  @observable code;
  @observable name;
  @observable categoryCombo;
  @observable valueType;

  @observable mapping;

  @observable uniqueCategoryOptionCombos;


  @action setId = val => this.id = val;
  @action setName = val => this.name = val;
  @action setCode = val => this.code = val;
  @action setCategoryCombo = val => this.categoryCombo = val;
  @action setMapping = val => this.mapping = val;
  @action setUniqueCategoryOptionCombos = val => this.uniqueCategoryOptionCombos = val;
  @action setValueType = val => this.valueType = val;


  @action handelMappingChange = (currentData, cocColumn, isDhis2) => val => {
    this.setMapping(val);
    if (!isDhis2 && !_.isEmpty(currentData)) {
      if (val) {
        const data = currentData[val.value];
        if (data && _.isArray(data)) {
          let processed = data.map(d => {
            return { label: d[cocColumn.value], value: d[cocColumn.value] }
          });
          processed = _.uniqBy(processed, 'value');
          this.setUniqueCategoryOptionCombos(processed);
        }
      }
    } else {
      if (val) {
        this.setUniqueCategoryOptionCombos(currentData[val.value]);
      }
    }
  };
}

export default Element;
