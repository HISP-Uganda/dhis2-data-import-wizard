import { action, observable } from "mobx";

class OrganisationUnit {
  @observable id;
  @observable name;
  @observable code;
  @observable mapping;
  @observable isSelected = true;

  @action setId = (val) => (this.id = val);
  @action setName = (val) => (this.name = val);
  @action setCell = (val) => (this.cell = val);
  @action setCode = (val) => (this.code = val);
  @action setMapping = (val) => (this.mapping = val);

  @action setSelected = (e) => (this.isSelected = e.target.checked);
  @action changeIsSelected = (val) => (this.isSelected = val);

  constructor(id, name, code) {
    this.id = id;
    this.code = code;
    this.name = name;
  }
}

export default OrganisationUnit;
