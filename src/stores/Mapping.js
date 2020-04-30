import {action, observable} from "mobx";

class Mapping {
  @observable nameColumn;
  @observable shortNameColumn;
  @observable descriptionColumn;
  @observable codeColumn;
  @observable idColumn;
  @observable level;
  @observable longitudeColumn;
  @observable latitudeColumn;

  @action setNameColumn = value => this.nameColumn = value;
  @action setShortNameColumn = value => this.shortNameColumn = value;
  @action setDescriptionColumn = value => this.descriptionColumn = value;
  @action setCodeColumn = value => this.codeColumn = value;
  @action setIdColumn = value => this.idColumn = value;
  @action setLevel = value => this.level = value;
  @action setLatitudeColumn = val => this.latitudeColumn = val;
  @action setLongitudeColumn = val => this.longitudeColumn = val;

}

export default Mapping;
