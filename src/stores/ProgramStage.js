import { action, computed, observable } from "mobx";
import _ from "lodash";
import moment from "moment";
import { searchOrgUnit } from "../utils/utils";

class ProgramStage {
    @observable id;
    @observable name;
    @observable displayName;
    @observable repeatable;
    @observable programStageDataElements = [];

    @observable dataElementsFilter;

    @observable page = 0;
    @observable rowsPerPage = 5;

    @observable orderBy = 'compulsory';
    @observable order = 'desc';

    @observable eventDateIdentifiesEvent = false;
    @observable completeEvents = false;
    @observable longitudeColumn;
    @observable latitudeColumn;
    @observable createNewEvents = false;
    @observable updateEvents = true;
    @observable eventDateColumn;
    @observable eventsByDate = {};
    @observable eventsByDataElement = {};


    constructor(id, name, displayName, repeatable, programStageDataElements) {
        this.id = id;
        this.name = name;
        this.displayName = displayName;
        this.repeatable = repeatable;
        this.programStageDataElements = programStageDataElements;
    }

    @action filterDataElements = val => this.dataElementsFilter = val.toLowerCase();
    @action handleChangeElementPage = (event, page) => this.page = page;
    @action handleChangeElementRowsPerPage = event => this.rowsPerPage = event.target.value;
    @action setOrder = order => this.order = order;
    @action setOrderBy = orderBy => this.orderBy = orderBy;


    @action createSortHandler = property => event => {
        const orderBy = property;
        let order = 'desc';

        if (this.orderBy === property && this.order === 'desc') {
            order = 'asc';
        }
        this.setOrderBy(orderBy);
        this.setOrder(order);

    };

    @action makeEventDateAsIdentifier = program => async event => {
        this.setEventDateAsIdentifier(event.target.checked);
        if (!this.eventDateIdentifiesEvent) {
            this.setEventsByDate({});
        }
    };

    @action setEventDateColumn = columns => value => {
        this.setDate(value);

        if (this.eventDateColumn) {
            this.loadDefault(columns);
        }
    };
    @action markEventsAsComplete = event => this.completeEvents = event.target.checked;
    @action setEventDateAsIdentifier = val => this.eventDateIdentifiesEvent = val;
    @action setLongitudeColumn = value => this.longitudeColumn = value;
    @action setLatitudeColumn = value => this.latitudeColumn = value;
    @action setCompleteEvents = value => this.completeEvents = value;
    @action setDate = value => this.eventDateColumn = value;
    @action setCreateNewEvents = val => this.createNewEvents = val;
    @action setUpdateEvents = val => this.updateEvents = val;
    @action setEventsByDate = val => this.eventsByDate = val;
    @action setEventsByDataElement = val => this.eventsByDataElement = val;
    @action setProgramStageDataElements = val => this.programStageDataElements = val;


    @action
    handleCreateNewEventsCheck = event => {
        this.createNewEvents = event.target.checked;
        if (!this.createNewEvents && !this.updateEvents) {
            this.eventDateColumn = null;
        }
    };

    @action
    handleUpdateEventsCheck = event => {
        this.updateEvents = event.target.checked;
        if (!this.createNewEvents && !this.updateEvents) {
            this.eventDateColumn = null;
        }
    };

    findEventsByDates = async (program) => {
        const { d2, orgUnitColumn, id, organisationUnits, orgUnitStrategy } = program;
        const uploadedData = program.data;
        if (d2 && orgUnitColumn && uploadedData && id && this.eventDateColumn && this.eventDateIdentifiesEvent) {
            const api = d2.Api.getApi();
            let eventDates = uploadedData.map(d => {
                const ou = searchOrgUnit(d[orgUnitColumn.value], orgUnitStrategy, organisationUnits);
                return {
                    eventDate: moment(d[this.eventDateColumn.value]).format('YYYY-MM-DD'),
                    orgUnit: ou ? ou.id : undefined
                };
            }).filter(e => {
                return e.orgUnit && e.eventDate
            });

            eventDates = _.uniq(eventDates);
            const all = eventDates.map(e => {
                return api.get('events.json', {
                    program: id,
                    startDate: e.eventDate,
                    endDate: e.eventDate,
                    pageSize: 1,
                    orgUnit: e.orgUnit,
                    fields: 'event,eventDate,program,programStage,orgUnit,dataValues[dataElement,value]'
                });
            });
            const data = await Promise.all(all);
            const processed = data.filter(response => {
                return response.events.length > 0;
            }).map(response => {
                const event = response.events[0];
                return [moment(event.eventDate).format('YYYY-MM-DD'), event]
            });
            return _.fromPairs(processed);
        }
    };

    findEventsByElements = async (program) => {
        const { d2, id, orgUnitColumn, organisationUnits, orgUnitStrategy } = program;
        const uploadedData = program.data;
        if (d2 && uploadedData && id && this.elementsWhichAreIdentifies.length > 0) {
            const elements = this.elementsWhichAreIdentifies.map(e => {
                return e.dataElement.id;
            });

            const api = d2.Api.getApi();

            let values = uploadedData.map(d => {
                return this.elementsWhichAreIdentifies.map(e => {
                    const ou = searchOrgUnit(d[orgUnitColumn.value], orgUnitStrategy, organisationUnits);
                    return { value: d[e.column.value], de: e.dataElement.id, orgUnit: ou ? ou.id : null };
                });
            }).filter(f => _.every(f, v => {
                return v.value !== null && v.value !== undefined && v.value !== '' && v.orgUnit
            }));

            values = _.uniqBy(values, v => {
                return JSON.stringify(v);
            });

            const all = values.map((e, i) => {
                const filter = e.map(v => {
                    return `filter=${v.de}:EQ:${v.value}`
                }).join('&');
                return api.get(`events.json?program=${id}&orgUnit=${e[0].orgUnit}&pageSize=1&fields=event,eventDate,program,programStage,orgUnit,dataValues[dataElement,value]&${filter}`, {})
            });
            const data = await Promise.all(all);
            const processed = data.filter(response => {
                return response.events.length > 0;
            }).map(response => {
                const event = response.events[0];
                const es = event.dataValues.filter(d => {
                    return elements.indexOf(d.dataElement) !== -1 && d.value;
                }).map(s => s.value).join('@');
                return [es, event]
            });

            return _.fromPairs(processed);
        }
    };

    @action makeElementAsIdentifier = (psde, program) => async event => {
        psde.dataElement.setAsIdentifier(event.target.checked);
        if (!program.isTracker) {
            await this.findEventsByElements(program);
        }

    };

    @action loadDefault = (columns) => {
        if (this.createNewEvents || this.updateEvents) {
            const mapped = this.programStageDataElements.map(de => {
                const match = columns.find(column => {
                    return column.value === de.dataElement.name;
                });
                if (match && !de.column) {
                    de.setColumn(match);
                }
                return de;
            });
            this.setProgramStageDataElements(mapped);
        }
    };


    @computed
    get dataElements() {
        const sorter = this.order === 'desc'
            ? (a, b) => (b[this.orderBy] < a[this.orderBy] ? -1 : 1)
            : (a, b) => (a[this.orderBy] < b[this.orderBy] ? -1 : 1);
        /*const elements = this.programStageDataElements.map(e => {
            return {...e, ...e.dataElement};
        });*/
        return this.programStageDataElements.filter(item => {
            const displayName = item.dataElement.displayName.toLowerCase();
            return displayName.includes(this.dataElementsFilter ? this.dataElementsFilter : '')
        }).sort(sorter).slice(this.page * this.rowsPerPage, this.page * this.rowsPerPage + this.rowsPerPage);
    }

    @computed
    get pages() {
        return this.programStageDataElements.length;
    }

    @computed get elementsWhichAreIdentifies() {
        return this.programStageDataElements.filter(psde => {
            return psde.dataElement.identifiesEvent && !_.isEmpty(psde.column);
        });
    }

}

export default ProgramStage;
