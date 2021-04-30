import { action, observable } from "mobx";

class DataElement {
  @observable id;
  @observable code;
  @observable name;
  @observable displayName;
  @observable valueType;
  @observable optionSet;
  @observable identifiesEvent = false;

  constructor(
    id,
    code,
    name,
    displayName,
    valueType,
    optionSetValue,
    optionSet
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.displayName = displayName;
    this.valueType = valueType;
    this.optionSetValue = optionSetValue;
    this.optionSet = optionSet;
  }

  @action makeAsIdentifier = (event) =>
    (this.identifiesEvent = event.target.checked);
  @action setAsIdentifier = (val) => (this.identifiesEvent = val);
}

export default DataElement;
