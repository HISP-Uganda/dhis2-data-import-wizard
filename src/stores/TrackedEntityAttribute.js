import { observable } from "mobx";

class TrackedEntityAttribute {
  @observable code;
  @observable name;
  @observable id;
  @observable displayName;
  @observable optionSet;
  @observable optionSetValue;
  @observable unique;

  constructor(id, code, name, displayName, unique, optionSetValue, optionSet) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.displayName = displayName;
    this.unique = unique;
    this.optionSetValue = optionSetValue;
    this.optionSet = optionSet;
  }
}

export default TrackedEntityAttribute;
