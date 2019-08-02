import {action, observable} from "mobx";

class Param {
    @observable param = '';
    @observable value = '';
    @observable isPeriod = false;
    @observable periodType;

    @action setValue = value => this.value = value;
    @action setParam = value => this.param = value;
    @action setIsPeriod = value => this.isPeriod = value;
    @action setPeriodType = value => this.periodType = value;

    @action handleIsPeriodChange = event => {
        this.setIsPeriod(event.target.checked);
        if (!this.isPeriod) {
            this.setPeriodType(null);
        }
    };

    @action handlePeriodTypeChange = event => {
        this.setPeriodType(event.target.value);
    };

}

export default Param;
