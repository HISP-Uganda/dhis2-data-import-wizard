import { action, observable } from "mobx";

class Mapping {
    @observable nameColumn;
    @observable shortNameColumn;
    @observable descriptionColumn;
    @observable codeColumn;
    @observable idColumn;
    @observable level;

    @action setNameColumn = value => this.nameColumn = value;
    @action setShortNameColumn = value => this.shortNameColumn = value;
    @action setDescriptionColumn = value => this.descriptionColumn = value;
    @action setCodeColumn = value => this.codeColumn = value;
    @action setIdColumn = value => this.idColumn = value;
    @action setLevel = value => this.level = value;

}

export default Mapping;
