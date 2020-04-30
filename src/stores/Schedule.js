import {action, observable, computed} from "mobx";
import moment from "moment";

class Schedule {
  @observable name = '';
  @observable type;
  @observable value;
  @observable schedule;
  @observable created = moment().toString();
  @observable next = '';
  @observable last = '';
  @observable additionalDays = 0;
  @observable url = 'http://localhost:3001';
  @observable upstream = '';

  @action setName = val => this.name = val;
  @action setType = val => this.type = val;
  @action setValue = val => {
    this.value = val;

    if (this.value) {
      const mapping = this.value.value;
      if (mapping.periodType) {
        this.schedule = mapping.periodType;
      }
    }
  };
  @action setSchedule = val => this.schedule = val;
  @action setCreated = val => this.created = val;
  @action setNext = val => this.next = val;
  @action setLast = val => this.last = val;
  @action setUrl = val => this.url = val;
  @action setAdditionalDays = val => this.additionalDays = val;
  @action setUpstream = val => this.upstream = val;

  @action handleScheduleChange = event => {
    this.setSchedule(event.target.value)
  };

  @computed get isSaveDisabled() {
    return this.url === '' || this.name === '' || !this.value;
  }

  @computed get canAddDays() {
    return this.schedule === 'Weekly' || this.schedule === 'Monthly' || this.schedule === 'Quarterly' || this.schedule === 'SixMonthly' || this.schedule === 'Yearly'
  }
}

export default Schedule;
