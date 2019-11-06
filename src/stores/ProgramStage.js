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
        let processed = []
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
                    pageSize: 2,
                    orgUnit: e.orgUnit,
                    fields: 'event,eventDate,program,programStage,orgUnit,dataValues[dataElement,value]'
                });
            });
            const results = await Promise.all(all);
            results.forEach(result => {
                const { events } = result;
                if (events.length > 0) {
                    const event = events[0];
                    if (events.length === 1) {
                        processed = [...processed, [moment(event.eventDate).format('YYYY-MM-DD'), { event, many: false }]]
                    } else {
                        processed = [...processed, [moment(event.eventDate).format('YYYY-MM-DD'), { event, many: true }]]
                    }
                }
            });
        }
        return _.fromPairs(processed);
    };

    searchOrganisation = (unit, sourceOrganisationUnits) => {
        const ou = sourceOrganisationUnits.find(sou => unit === sou.name);
        if (ou) {
            return ou.mapping.value
        }
        return null;

    }

    convertRows2Events = (rows) => {
        return rows.map(e => {
            const { event, eventDate, program, programStage, orgUnit, ...rest } = e
            const dataValues = this.programStageDataElements.map(psde => {
                return { dataElement: psde.dataElement.id, value: rest[psde.dataElement.id] }
            });
            return { event, eventDate, program, programStage, orgUnit, dataValues }
        })
    }

    findEvents = async program => {
        let processed = []
        const { d2, orgUnitColumn, sourceOrganisationUnits } = program;
        const uploadedData = program.data;
        let eventDates;
        let values;
        let elements

        if (uploadedData && d2) {
            const api = d2.Api.getApi();
            if (this.elementsWhichAreIdentifies.length > 0) {
                elements = this.elementsWhichAreIdentifies.map(e => {
                    return e.dataElement.id;
                });
                values = uploadedData.map(d => {
                    return this.elementsWhichAreIdentifies.map(e => {
                        const ou = this.searchOrganisation(d[orgUnitColumn.value], sourceOrganisationUnits);
                        return { value: d[e.column.value], de: e.dataElement.id, orgUnit: ou };
                    });
                }).filter(f => _.every(f, v => {
                    return v.value !== null && v.value !== undefined && v.value !== '' && v.orgUnit
                }));
                values = _.uniqBy(values, v => {
                    return JSON.stringify(v);
                });
            }
            if (this.eventDateColumn && this.eventDateIdentifiesEvent) {
                eventDates = uploadedData.map(d => {
                    const ou = this.searchOrganisation(d[orgUnitColumn.value], sourceOrganisationUnits);
                    const date = moment(d[this.eventDateColumn.value]);
                    return {
                        eventDate: date.isValid() ? date.format('YYYY-MM-DD') : null,
                        orgUnit: ou
                    };
                }).filter(e => {
                    return e.orgUnit && e.eventDate
                });

                eventDates = _.uniqBy(eventDates, v => {
                    return JSON.stringify(v);
                });
            }

            if (eventDates && values && elements) {
                const minDate = _.min(eventDates).eventDate;
                const maxDate = _.max(eventDates).eventDate;
                let { rows, headers } = await api.get(`events/query.json?programStage=${this.id}&skipPaging=true&startDate=${minDate}&endDate=${maxDate}`, {});
                headers = headers.map(h => h['name']);
                let response = rows.map(r => {
                    return Object.assign.apply({}, headers.map((v, i) => ({
                        [v]: r[i]
                    })));
                });

                const gp = _.groupBy(response, (v => {
                    const element = elements.map(e => v[e]).join('@')
                    const date = moment(v.eventDate).format('YYYY-MM-DD');
                    return `${date}${v.orgUnit}${element}`;
                }));

                let pp = []
                _.forOwn(gp, (v, k) => {
                    const events = this.convertRows2Events(v);
                    const event = events[0];
                    pp = [...pp, [k, { event, many: events.length > 1 }]]
                });
                processed = [...processed, ...pp];

            } else if (values && elements) {
                const chunked = _.chunk(values, 250);
                for (const value of chunked) {
                    const flattened = _.flatten(value);
                    const grouped = _.groupBy(flattened, 'de');
                    const elements = _.keys(grouped)
                    const filter = elements.map(de => {
                        const vals = grouped[de].map(v => {
                            const val = v.value;
                            if (val && Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
                                return '';
                            }
                            return val;
                        }).join(';');
                        return `filter=${de}:IN:${vals}`
                    }).join('&');

                    let { rows, headers } = await api.get(`events/query.json?programStage=${this.id}&skipPaging=true&${filter}`, {});
                    headers = headers.map(h => h['name']);
                    const response = rows.map(r => {
                        return Object.assign.apply({}, headers.map((v, i) => ({
                            [v]: r[i]
                        })));
                    });

                    const gp = _.groupBy(response, (v => {
                        return elements.map(e => v[e]).join('@')
                    }));
                    let pp = []

                    _.forOwn(gp, (v, k) => {
                        const events = this.convertRows2Events(v);
                        const event = events[0];
                        pp = [...pp, [k, { event, many: events.length > 1 }]]
                    })
                    processed = [...processed, ...pp];
                }
            } else if (eventDates) {
                const minDate = _.min(eventDates).eventDate;
                const maxDate = _.max(eventDates).eventDate;
                let { rows, headers } = await api.get(`events/query.json?programStage=${this.id}&skipPaging=true&startDate=${minDate}&endDate=${maxDate}`, {});
                headers = headers.map(h => h['name']);
                let response = rows.map(r => {
                    return Object.assign.apply({}, headers.map((v, i) => ({
                        [v]: r[i]
                    })));
                });

                const gp = _.groupBy(response, (v => {
                    const date = moment(v.eventDate).format('YYYY-MM-DD');
                    return `${date}${v.orgUnit}`;
                }));

                let pp = []
                _.forOwn(gp, (v, k) => {
                    const events = this.convertRows2Events(v);
                    const event = events[0];
                    pp = [...pp, [k, { event, many: events.length > 1 }]]
                });
                processed = [...processed, ...pp];
            }
        }
        return _.fromPairs(processed);

    }

    @action makeElementAsIdentifier = (psde) => event => {
        psde.dataElement.setAsIdentifier(event.target.checked);
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
