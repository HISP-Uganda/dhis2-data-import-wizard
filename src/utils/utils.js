import _ from "lodash";
import moment from "moment";
import {generateUid} from "./uid";

export const nest = function (seq, keys) {
  if (!keys.length)
    return seq;
  const first = keys[0];
  const rest = keys.slice(1);
  return _.mapValues(_.groupBy(seq, first), function (value) {
    return nest(value, rest)
  });
};

export const findAttributeCombo = (categoryCombo, data) => {
  return categoryCombo.categoryOptionCombos.find(coc => {
    const attributeCombo = data.map(v => {
      const match = coc.categoryOptions.find(co => {
        return v !== undefined && (co.id === v || co.name === v);
      });
      return !!match;
    });
    return _.every(attributeCombo);
  });
};


export const encodeData = (objs) => {
  return objs.map(s => {
    return encodeURIComponent(s.param) + '=' + encodeURIComponent(s.value)
  }).join('&');
};

export const convertDataToURL = (objs) => {
  return objs.map(s => {
    return s.param + '=' + s.value
  }).join('&');
};

export const enumerateDates = (startDate, endDate, addition, format) => {
  const dates = [];
  const currDate = moment(startDate).startOf(addition);
  const lastDate = moment(endDate).startOf(addition);
  dates.push(currDate.clone().format(format));
  while (currDate.add(1, addition).diff(lastDate) <= 0) {
    dates.push(currDate.clone().format(format));
  }
  return dates;
};

export const allSourceWithMapping = (dataSet) => {
  const ous = dataSet.sourceOrganisationUnits.filter(ou => {
    return !_.isEmpty(ou.mapping)
  }).map(ou => {
    return [ou.id, ou.mapping.value];
  });

  return _.fromPairs(ous);
};

export const processOrganisationUnits = (dataSet) => {
  if (dataSet.orgUnitStrategy && dataSet.organisationUnits) {
    return _.fromPairs(dataSet.organisationUnits.map(o => {
      if (dataSet.orgUnitStrategy && dataSet.orgUnitStrategy.value === 'name') {
        return [o.name.toLowerCase(), o.id];
      } else if (dataSet.orgUnitStrategy && dataSet.orgUnitStrategy.value === 'code') {
        return [o.code, o.id];
      }
      return [o.id, o.id];

    }));
  }
  return {};
};

export const allDataElementsTypes = (forms) => {

  const elements = forms.map(form => {
    return form.dataElements.map(de => {
      return [de.id, de.valueType];
    })
  });

  const flattened = _.flatten(elements);

  return _.fromPairs(flattened)

};

export const validate = (elements, element, value) => {
  const type = elements[element];
  return validText(type, value);
};


export const processDataSet = (data, dataSet) => {
  let dataValues = [];
  let errors = [];
  let dataSetUnits = processOrganisationUnits(dataSet);
  const {
    templateType,
    forms,
    periodColumn,
    dataValueColumn,
    orgUnitColumn,
    categoryCombo,
    categoryOptionComboColumn,
    periodInExcel,
    organisationUnitInExcel,
    organisation,
    organisationCell,
    attributeCombosInExcel,
    sourceOrganisationUnits,
    rows,
    dataElementColumn,
    cell2
  } = dataSet;
  if (templateType && templateType.value === '6' && dataElementColumn) {
    data = nest(data, [dataElementColumn.value]);
  }
  const elements = allDataElementsTypes(forms);
  if (templateType.value !== '2' && templateType.value !== '4') {
    forms.forEach(f => {
      if (templateType.value === '1' || templateType.value === '6') {
        let validatedData = [];
        f.dataElements.forEach(element => {
          if (element.mapping) {
            const foundData = data[element.mapping.value];
            if (foundData) {
              const groupedData = foundData.map(d => {

                const rowData = categoryCombo.categories.map(category => {
                  const optionColumn = category.mapping.value;
                  return d[optionColumn]
                });

                return {
                  period: d[periodColumn.value],
                  value: d[dataValueColumn.value],
                  orgUnit: d[orgUnitColumn.value] ? d[orgUnitColumn.value] : null,
                  dataElement: element.id,
                  attributeValue: rowData,
                  categoryOptionCombo: d[categoryOptionComboColumn.value] ? d[categoryOptionComboColumn.value].toLowerCase() : null
                }
              });
              validatedData = [...validatedData, ...groupedData];
            }
          }
        });
        data = validatedData;
      }
      if (data.length > 0 || !_.isEmpty(data)) {
        f.categoryOptionCombos.forEach(coc => {
          if (templateType.value === '1' || templateType.value === '6') {
            _.forOwn(coc.mapping, (mapping, dataElement) => {
              const filtered = data.filter(v => {
                return mapping && mapping.value && v.categoryOptionCombo === mapping.value.toLowerCase() && v.dataElement === dataElement;
              });
              filtered.forEach(d => {
                const attribute = findAttributeCombo(categoryCombo, d.attributeValue);
                if (d['orgUnit'] && attribute) {
                  const orgUnit = searchSourceOrgUnits(d['orgUnit'], sourceOrganisationUnits);
                  if (orgUnit && orgUnit.mapping) {
                    dataValues = [...dataValues, {
                      dataElement,
                      value: d['value'],
                      period: d['period'],
                      attributeOptionCombo: attribute.id,
                      categoryOptionCombo: coc.id,
                      orgUnit: orgUnit.mapping.value
                    }];
                  } else {
                    if (orgUnit) {
                      errors = [...errors, {
                        error: `Organisation unit ${d['orgUnit']} not mapped`,
                      }]
                    }
                  }
                } else {
                  if (!d['orgUnit']) {
                    errors = [...errors, {
                      error: 'Organisation unit empty',
                    }]
                  }
                  if (!attribute) {
                    errors = [...errors, {
                      error: `Attribute with value ${d.attributeValue} not found`,
                    }]
                  }
                }
              });
            });
          } else if (templateType.value === '3') {
            _.forOwn(coc.cell, (mapping, dataElement) => {
              let orgUnit;
              let period;
              if (!periodInExcel) {
                period = dataSet.period;
              } else if (periodColumn) {
                const p = data[periodColumn.value]['v'];
                period = p.toString();
              }

              if (!organisationUnitInExcel) {
                orgUnit = organisation.value
              } else {
                const ou = data[organisationCell.value]['v'];
                const foundOU = dataSetUnits[ou];
                if (foundOU) {
                  orgUnit = foundOU;
                } else {
                  errors = [...errors, {error: `Organisation unit ${ou} not found`}]
                }
              }

              let found;

              if (attributeCombosInExcel) {
                const rowData = categoryCombo.categories.map(category => {
                  const value = data[category.mapping.value];
                  return value ? value.v : undefined;
                });
                found = findAttributeCombo(categoryCombo, rowData);

              } else {
                const rowData = categoryCombo.categories.map(category => {
                  return category.mapping.value;
                });
                found = findAttributeCombo(categoryCombo, rowData);
              }
              if (found) {
                dataValues = [...dataValues, {
                  dataElement,
                  value: data[mapping.value]['v'],
                  categoryOptionCombo: coc.id,
                  period,
                  attributeOptionCombo: found.id,
                  orgUnit
                }]
              } else {
                errors = [...errors, {
                  error: `Attribute with value not found`,
                }]
              }
            });
          } else if (templateType.value === '5') {
            const units = allSourceWithMapping(dataSet);
            _.forOwn(coc.mapping, (mapping, dataElement) => {

              const filtered = data.filter(v => {
                return mapping && mapping.value && v.dx === mapping.value;
              });
              filtered.forEach(d => {
                const attribute = findAttributeCombo(categoryCombo, []);
                if (attribute) {
                  const orgUnit = units[d['ou']];
                  if (orgUnit) {
                    dataValues = [...dataValues, {
                      dataElement,
                      value: d['value'],
                      period: d['pe'],
                      attributeOptionCombo: attribute.id,
                      categoryOptionCombo: coc.id,
                      orgUnit
                    }];
                  } else {
                    errors = [...errors, {
                      error: `Organisation ${d['ou']} not found`,
                    }]
                  }
                } else {
                  errors = [...errors, {
                    error: `Attribute with value not found`,
                  }]
                }
              });
            });
          }
        });
      }
    });
  } else if (templateType.value === '2') {
    rows.forEach(i => {
      const rowData = categoryCombo.categories.map(category => {
        const optionCell = category.mapping.value + i;
        const optionValue = data[optionCell];
        return optionValue ? optionValue.v : undefined;
      });
      const found = findAttributeCombo(categoryCombo, rowData);
      if (found) {
        _.forOwn(cell2, v => {
          const oCell = orgUnitColumn.value + i;
          const pCell = periodColumn.value + i;
          const vCell = v.value.column + i;
          const ouVal = data[oCell];
          const periodVal = data[pCell];
          const ou = ouVal ? ouVal['v'] : '';
          const period = periodVal ? periodVal['v'] : null;
          const val = data[vCell];
          const value = val ? val.v : null;
          const orgUnit = searchSourceOrgUnits(ou, sourceOrganisationUnits);
          if (orgUnit && orgUnit.mapping && value !== null && value !== '' && period !== null) {
            if (validate(elements, v.value.dataElement, value)) {
              dataValues = [...dataValues, {
                orgUnit: orgUnit.mapping.value,
                period,
                value,
                dataElement: v.value.dataElement,
                attributeOptionCombo: found.id,
                categoryOptionCombo: v.value.categoryOptionCombo
              }];
            } else {
              errors = [...errors, {
                error: `Value ${value} on cell ${vCell} not valid expected ${elements[v.value.dataElement]}`,
              }]
            }
          } else {
            if (!orgUnit) {
              errors = [...errors, {
                error: `Organisation unit ${ou} on cell ${oCell} not found`,
              }]
            }
            if (orgUnit && !orgUnit.mapping) {
              errors = [...errors, {
                error: `Organisation unit ${ou} on cell ${oCell} not mapped`,
              }]
            }
            if (!period) {
              errors = [...errors, {
                error: `Period missing`,
              }]
            }

            if (!value || value === '') {
              errors = [...errors, {
                error: `Value on cell ${vCell} is missing`,
              }]
            }
          }
        });
      }
    });
  } else if (templateType.value === '4') {
    _.forOwn(cell2, v => {
      const {dataElement, categoryOptionCombo} = v.value.mapping
      const found = data.filter(d => {
        return d.dataElement === v.value.dataElement && d.categoryOptionCombo === v.value.categoryOptionCombo;
      }).map(f => {
        const ou = searchSourceOrgUnits(f.orgUnit, sourceOrganisationUnits);
        let orgUnit = null;
        if (ou && ou.mapping) {
          orgUnit = ou.mapping.value
        } else if (!ou) {
          errors = [...errors, {
            error: `Organisation unit ${f.orgUnit} not found`,
          }]
        }
        if (ou && !ou.mapping) {
          errors = [...errors, {
            error: `Organisation unit ${f.orgUnit} not mapped`,
          }]
        }
        const {value, period} = f;
        return {
          orgUnit,
          value,
          period,
          dataElement,
          categoryOptionCombo
        }
      }).filter(v => !!v.orgUnit);

      dataValues = [...dataValues, ...found];
    });
  }
  return {
    dataValues,
    errors
  }

};

export const programUniqueColumn = (program) => {
  const unique = program.programTrackedEntityAttributes.filter(a => {
    return a.trackedEntityAttribute.unique && a.column;
  });

  if (unique.length > 0) {
    return unique[0]['column']['value'];
  }

  return null;
};

export const programUniqueAttribute = (program) => {
  const unique = program.programTrackedEntityAttributes.filter(a => {
    return a.trackedEntityAttribute.unique && a.column;
  });

  if (unique.length > 0) {
    return unique[0]['trackedEntityAttribute']['id'];
  }

  return null;
};
export const validText = (dataType, value, dataSource) => {
  switch (dataType) {
    case 'TEXT':
    case 'LONG_TEXT':
      return !!value;
    case 'NUMBER':
      return !isNaN(value);
    case 'EMAIL':
      const re = /\S+@\S+\.\S+/;
      return re.test(String(value).toLowerCase());
    case 'BOOLEAN':
      return value === false || value === true;
    case 'TRUE_ONLY':
      return value + '' === true + '';
    case 'PERCENTAGE':
      return value >= 0 && value <= 100;
    case 'INTEGER':
      return !isNaN(value) && !isNaN(parseInt(value, 10));
    case 'DATE':
    case 'DATETIME':
    case 'TIME':
      if (['xlsx', 'xls'].indexOf(dataSource) !== -1) {
        const evDate = -2209075200000 + (value - (value < 61 ? 0 : 1)) * 86400000;
        return moment(new Date(evDate)).isValid();
      }
      return moment(value).isValid();
    case 'UNIT_INTERVAL':
      return value >= 0 && value <= 1;
    case 'INTEGER_NEGATIVE':
      return Number.isInteger(value) && value >= 0;
    case 'NEGATIVE_INTEGER':
      return Number.isInteger(value) && value < 0;
    case 'INTEGER_ZERO_OR_POSITIVE':
    case 'AGE':
      return Number.isInteger(value) && value >= 0;
    case 'COORDINATE':
      try {
        const c = JSON.parse(value);
        return _.isArray(c) && c.length === 2
      } catch (e) {
        return false;
      }
    default:
      return true
  }
};

export const validateValue = (dataType, value, optionSet, dataSource) => {
  if (optionSet) {
    const options = optionSet.options.map(o => {
      return {
        code: o.code,
        value: o.value
      }
    });
    const coded = _.find(options, o => {
      return String(value).toLowerCase() === String(o.code).toLowerCase() || String(value).toLowerCase() === String(o.value).toLowerCase();
    });
    if (!!coded) {
      return coded.code;
    }
  } else if (validText(dataType, value, dataSource)) {
    if (['xlsx', 'xls'].indexOf(dataSource) !== -1) {
      const evDate = -2209075200000 + (value - (value < 61 ? 0 : 1)) * 86400000;
      if (dataType === 'DATETIME') {
        return moment(new Date(evDate)).format('YYYY-MM-DDTHH:mm');
      } else if (dataType === 'DATE') {
        return moment(new Date(evDate)).format('YYYY-MM-DD');
      } else if (dataType === 'TIME') {
        return moment(new Date(evDate)).format('HH:mm');
      }
      return value;
    } else {
      if (dataType === 'DATETIME') {
        return moment(value).format('YYYY-MM-DDTHH:mm');
      } else if (dataType === 'DATE') {
        return moment(value).format('YYYY-MM-DD');
      } else if (dataType === 'TIME') {
        return moment(value).format('HH:mm');
      }
      return value;
    }
  }
  return null;
};

export const searchOrgUnit = (val, orgUnitStrategy, organisationUnits) => {
  switch (orgUnitStrategy.value) {
    case 'uid':
      return _.find(organisationUnits, {
        id: val
      });
    case 'code':
      return _.find(organisationUnits, {
        code: val
      });
    case 'name':
      return _.find(organisationUnits, {
        name: val
      });
    case 'auto':
      const s1 = _.find(organisationUnits, {
        id: val
      });
      const s2 = _.find(organisationUnits, {
        code: val
      });
      const s3 = _.find(organisationUnits, {
        name: val
      });
      if (s1 !== undefined) {
        return s1;
      } else if (s2 !== undefined) {
        return s2;
      } else if (s3 !== undefined) {
        return s3;
      } else {
        return undefined;
      }
    default:
      return undefined;
  }
};

export const searchSourceOrgUnits = (orgUnit, organisationUnits) => {
  return organisationUnits.find(u => {
    return u.name === orgUnit;
  })
};


export const removeDuplicates = (evs, stageEventFilters) => {
  if (stageEventFilters && stageEventFilters.elements && stageEventFilters.event) {
    evs = _.uniqBy(evs, v => {
      const filteredAndSame = stageEventFilters.elements.map(se => {
        const foundPrevious = _.filter(v.dataValues, {
          dataElement: se
        });
        if (foundPrevious.length > 0) {
          const exists = foundPrevious[0].value;
          return {
            exists
          };
        } else {
          return {
            exists: false
          }
        }
      });

      if (_.some(filteredAndSame, {
        'exists': false
      })) {
        return v.event;
      } else {
        return JSON.stringify([v.eventDate, filteredAndSame])
      }
    });

  } else if (stageEventFilters && stageEventFilters.elements && stageEventFilters.elements.length > 0) {

    evs = _.uniqBy(evs, v => {
      const filteredAndSame = stageEventFilters.elements.map(se => {
        const foundPrevious = _.filter(v.dataValues, {
          dataElement: se
        });
        if (foundPrevious.length > 0) {
          const exists = foundPrevious[0].value;
          return {
            exists
          };
        } else {
          return {
            exists: false
          }
        }
      });

      if (_.some(filteredAndSame, {
        'exists': false
      })) {
        return v.event;
      } else {
        return JSON.stringify([filteredAndSame])
      }
    });

  } else if (stageEventFilters && stageEventFilters.event) {
    evs = _.uniqBy(evs, v => {
      return v.eventDate;
    });
  }

  return evs;
};

export const searchEvent = (enrollmentEvents, stageEventFilters, stage, e) => {
  return _.findIndex(enrollmentEvents, item => {
    if (!stageEventFilters) {
      return false
    } else if (stageEventFilters.elements && stageEventFilters.event) {
      const filteredAndSame = stageEventFilters.elements.map(se => {
        const foundPrevious = _.filter(item.dataValues, {
          dataElement: se
        });
        const foundCurrent = _.filter(e.dataValues, {
          dataElement: se
        });
        if (foundCurrent.length > 0 && foundPrevious.length > 0) {
          const exists = foundPrevious[0].value === foundCurrent[0].value;
          return {
            exists
          };
        } else {
          return {
            exists: false
          }
        }
      });
      return item.programStage === stage &&
        moment(item.eventDate, 'YYYY-MM-DD').format('YYYY-MM-DD') ===
        moment(e.eventDate, 'YYYY-MM-DD').format('YYYY-MM-DD') &&
        _.every(filteredAndSame, 'exists');
    } else if (stageEventFilters.elements) {
      const filteredAndSame = stageEventFilters.elements.map(se => {
        const foundPrevious = _.filter(item.dataValues, {
          dataElement: se
        });
        const foundCurrent = _.filter(e.dataValues, {
          dataElement: se
        });
        if (foundCurrent.length > 0 && foundPrevious > 0) {
          return {
            exists: foundPrevious[0].value === foundCurrent[0].value
          };
        } else {
          return {
            exists: false
          }
        }
      });

      return item.programStage === stage && _.every(filteredAndSame, 'exists')
    } else if (stageEventFilters.event) {
      return item.programStage === stage &&
        moment(item.eventDate, 'YYYY-MM-DD').format('YYYY-MM-DD') ===
        moment(e.eventDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
    } else {
      return true
    }
  });
};

export const isTracker = (program) => {
  return program.programType === 'WITH_REGISTRATION';
};

export const groupEntities = (attribute, trackedEntityInstances) => {
  if (trackedEntityInstances) {
    const entities = trackedEntityInstances.map(e => {
      const uniqueAttribute = _.find(e.attributes, {
        attribute
      });
      const val = uniqueAttribute ? uniqueAttribute['value'] : null;
      return {
        ...e,
        ..._.fromPairs([
          [attribute, val]
        ])
      }
    });
    return _.groupBy(entities, attribute);
  }
  return {};
};


export const processProgramData = (data, program, uniqueColumn, instances) => {

  let eventsUpdate = [];
  let trackedEntityInstancesUpdate = [];

  let newEvents = [];
  let newEnrollments = [];
  let newTrackedEntityInstances = [];

  let duplicates = [];
  let conflicts = [];
  let errors = [];

  const {
    id,
    programStages,
    dataSource,
    programTrackedEntityAttributes,
    selectIncidentDatesInFuture,
    selectEnrollmentDatesInFuture,
    incidentDateColumn,
    enrollmentDateColumn,
    trackedEntityType,
    trackedEntity,
    updateEntities,
    createEntities,
    createNewEnrollments,
    orgUnitStrategy,
    orgUnitColumn,
    sourceOrganisationUnits,
    incidentDateProvided,
    categoryCombo
  } = program;

  if (uniqueColumn) {
    data = data.filter(d => {
      return d[uniqueColumn] !== null && d[uniqueColumn] !== undefined;
    });
    let clients = _.groupBy(data, uniqueColumn);
    let newClients = [];
    _.forOwn(clients, (data, client) => {
      const previous = instances[client] || [];
      newClients = [...newClients, {
        client,
        data,
        previous
      }];
    });
    data = newClients;
  } else if (data && data.length > 0) {
    data = data.map((data, i) => {
      return {
        data: [data],
        client: i + 1,
        previous: []
      };
    });
  }

  if (data && data.length > 0) {
    data.forEach(client => {
      let events = [];
      let allAttributes = [];
      let currentData = client.data;
      let enrollmentDates = [];
      let orgUnits = [];
      let identifierElements = {};
      currentData.forEach(d => {
        programStages.forEach(stage => {
          let dataValues = [];
          let eventDate;
          if (stage.eventDateColumn && (stage.createNewEvents || stage.updateEvents) && ['xlsx', 'xls'].indexOf(dataSource) !== -1) {
            const evDate = -2209075200000 + (d[stage.eventDateColumn.value] - (d[stage.eventDateColumn.value] < 61 ? 0 : 1)) * 86400000;
            const date = moment(new Date(evDate), 'YYYY-MM-DD');
            if (date.isValid()) {
              eventDate = date.format('YYYY-MM-DD');
            }
          } else if (stage.eventDateColumn && (stage.createNewEvents || stage.updateEvents)) {
            const date = moment(d[stage.eventDateColumn.value]);
            if (date.isValid()) {
              eventDate = date.format('YYYY-MM-DD');
            }
          }

          const mapped = stage.programStageDataElements.filter(e => {
            return e.column && e.column.value
          });

          identifierElements[stage.id] = {
            elements: mapped.filter(e => {
              return e.dataElement.identifiesEvent;
            }).map(e => e.dataElement.id),
            event: stage.eventDateIdentifiesEvent
          };
          let coordinate = null;
          if (stage.latitudeColumn && stage.longitudeColumn) {
            coordinate = {
              latitude: d[stage.latitudeColumn.value],
              longitude: d[stage.longitudeColumn.value]
            };
          }
          if (eventDate && mapped.length > 0) {
            mapped.forEach(e => {
              const value = d[e.column.value];
              const type = e.dataElement.valueType;
              const optionsSet = e.dataElement.optionSet;
              const validatedValue = validateValue(type, value, optionsSet);

              if (value !== '' && validatedValue !== null) {
                dataValues = [...dataValues, {
                  dataElement: e.dataElement.id,
                  value: validatedValue
                }];
              } else if (value !== undefined && value !== null) {
                conflicts = [...conflicts, {
                  error: optionsSet === null ? 'Invalid value ' + value + ' for value type ' + type : 'Invalid value: ' + value + ', expected: ' + _.map(optionsSet.options, o => {
                    return o.code
                  }).join(','),
                  row: client.client,
                  column: e.column.value
                }]
              }
            });

            const rowData = categoryCombo.categories.map(category => {
              return d[category.mapping.value]
            });
            const found = findAttributeCombo(categoryCombo, rowData);


            let event = {
              dataValues,
              eventDate,
              programStage: stage.id,
              program: id,
              event: generateUid()
            };

            if (coordinate) {
              event = {
                ...event,
                coordinate,
                geometry: {
                  type: 'Point',
                  coordinate,
                  coordinates: [coordinate.longitude, coordinate.latitude]
                }
              }
            }

            if (stage.completeEvents) {
              event = {
                ...event,
                ...{
                  status: 'COMPLETED',
                  completedDate: event['eventDate']
                }
              }
            }

            if (found) {
              event = {...event, attributeOptionCombo: found.id}
            }


            events = [...events, event];
          }
        });

        const mappedAttributes = programTrackedEntityAttributes.filter(a => {
          return a.column && a.column.value
        });

        let attributes = [];

        mappedAttributes.forEach(a => {
          const value = d[a.column.value];
          const type = a.valueType;
          const optionsSet = a.trackedEntityAttribute.optionSet;
          const validatedValue = validateValue(type, value, optionsSet);

          if (value !== '' && validatedValue !== null) {
            attributes = [...attributes, {
              attribute: a.trackedEntityAttribute.id,
              value: validatedValue
            }]
          } else if (value !== undefined) {
            conflicts = [...conflicts, {
              error: !optionsSet ? 'Invalid value ' + value + ' for value type ' + type : 'Invalid value ' + value + ' choose from options: ' +
                _.map(optionsSet.options, o => o.code).join(','),
              row: client.client,
              column: a.column.value
            }]
          }

        });

        if (attributes.length > 0) {
          allAttributes = [...allAttributes, attributes];
        }

        if (enrollmentDateColumn) {
          let enrollmentDate;
          let incidentDate;
          if (dataSource === 'xlsx' || dataSource === 'xls') {
            const eDate = -2209075200000 + (d[enrollmentDateColumn.value] - (d[enrollmentDateColumn.value] < 61 ? 0 : 1)) * 86400000;
            const currentDate = new Date(eDate);
            enrollmentDate = moment(currentDate, 'YYYY-MM-DD');
          } else {
            enrollmentDate = moment(d[enrollmentDateColumn.value]);
          }

          if (incidentDateProvided && incidentDateColumn) {
            if (dataSource === 'xlsx' || dataSource === 'xls') {
              const iDate = -2209075200000 + (d[incidentDateColumn.value] - (d[incidentDateColumn.value] < 61 ? 0 : 1)) * 86400000;
              incidentDate = moment(new Date(iDate), 'YYYY-MM-DD');
            } else {
              incidentDate = moment(d[incidentDateColumn.value], 'YYYY-MM-DD');
            }
          } else if (!incidentDateProvided) {
            incidentDate = enrollmentDate
          }

          if (enrollmentDate && incidentDate && enrollmentDate.isValid() && incidentDate.isValid()) {
            if (!selectEnrollmentDatesInFuture && !selectIncidentDatesInFuture) {
              if (enrollmentDate.isBefore(moment()) && incidentDate.isBefore(moment())) {
                enrollmentDates = [...enrollmentDates, {
                  enrollmentDate: enrollmentDate.format('YYYY-MM-DD'),
                  incidentDate: incidentDate.format('YYYY-MM-DD')
                }]
              } else {
                conflicts = [...conflicts, {
                  error: 'both enrollment and incident dates are in the feature which is different from program setup',
                  row: client.client
                }]
              }
            } else if (!selectEnrollmentDatesInFuture && selectIncidentDatesInFuture) {
              if (enrollmentDate.isBefore(moment())) {
                enrollmentDates = [...enrollmentDates, {
                  enrollmentDate: enrollmentDate.format('YYYY-MM-DD'),
                  incidentDate: incidentDate.format('YYYY-MM-DD')
                }]
              } else {
                conflicts = [...conflicts, {
                  error: 'enrollment date is in the feature which is different from program setup',
                  row: client.client
                }]
              }
            } else if (selectEnrollmentDatesInFuture && !selectIncidentDatesInFuture) {
              if (incidentDate.isBefore(moment())) {
                enrollmentDates = [...enrollmentDates, {
                  enrollmentDate: enrollmentDate.format('YYYY-MM-DD'),
                  incidentDate: incidentDate.format('YYYY-MM-DD')
                }]
              } else {
                conflicts = [...conflicts, {
                  error: 'incident date is in the feature which is different from program setup',
                  row: client.client
                }]
              }
            }
          } else {
            conflicts = [...conflicts, {
              error: 'enrollment or incident date is not valid',
              row: client.client
            }]
          }
        }

        if (orgUnitColumn && orgUnitColumn !== '') {
          orgUnits = [...orgUnits, d[orgUnitColumn.value]]
        }
      });
      let groupedEvents = _.groupBy(events, 'programStage');
      if (client.previous.length > 1) {
        duplicates = [...duplicates, {identifier: client.client}]
      } else if (client.previous.length === 1) {
        client.previous.forEach(p => {
          let enrollments = p['enrollments'];
          if (updateEntities) {
            const nAttributes = _.differenceWith(allAttributes[0], p['attributes'], (a, b) => {
              return a.attribute === b.attribute && String(a.value) === String(b.value);
            });
            if (nAttributes.length > 0) {
              const mergedAttributes = _.unionBy(allAttributes[0], p['attributes'], 'attribute');
              let tei;
              if (trackedEntityType) {
                tei = {
                  ..._.pick(p, ['orgUnit', 'trackedEntityInstance', 'trackedEntityType']),
                  attributes: mergedAttributes
                };
              } else if (trackedEntity) {
                tei = {
                  ..._.pick(p, ['orgUnit', 'trackedEntityInstance', 'trackedEntity']),
                  attributes: mergedAttributes
                };
              }
              trackedEntityInstancesUpdate = [...trackedEntityInstancesUpdate, tei];
            }
          }
          events = events.map(e => {
            return {
              ...e,
              trackedEntityInstance: p['trackedEntityInstance'],
              orgUnit: p['orgUnit']
            }
          });

          groupedEvents = _.groupBy(events, 'programStage');
          const enrollmentIndex = _.findIndex(enrollments, {
            program: id
          });
          if (enrollmentIndex === -1 && createNewEnrollments && enrollmentDates.length > 0) {
            let enroll = {
              program: id,
              orgUnit: p['orgUnit'],
              enrollment: generateUid(),
              trackedEntityInstance: p['trackedEntityInstance'],
              ...enrollmentDates[0]
            };
            newEnrollments = [...newEnrollments, enroll];
            _.forOwn(groupedEvents, (evs, stage) => {
              const stageEventFilters = identifierElements[stage];
              const stageInfo = _.find(programStages, {
                id: stage
              });
              const {
                repeatable,
                createNewEvents,
              } = stageInfo;

              evs = removeDuplicates(evs, stageEventFilters);
              if (createNewEvents) {
                if (!repeatable) {
                  const ev = _.maxBy(evs, 'eventDate');
                  if (ev.dataValues.length > 0) {
                    newEvents = [...newEvents, ev];
                  }
                } else {
                  newEvents = [...newEvents, ...evs];
                }
              }

            });

            enrollments = [...enrollments, enroll];
            p = {
              ...p,
              enrollments
            }
          } else if (enrollmentIndex === -1 && enrollmentDates.length === 0) {
            console.log('Ignoring new enrollments');
          } else if (enrollmentIndex !== -1) {
            let enrollment = enrollments[enrollmentIndex];
            let enrollmentEvents = enrollment['events'];
            _.forOwn(groupedEvents, (evs, stage) => {
              const stageInfo = _.find(programStages, {
                id: stage
              });
              const {
                repeatable,
                updateEvents,
                createNewEvents
              } = stageInfo;

              const stageEventFilters = identifierElements[stage];

              evs = removeDuplicates(evs, stageEventFilters);

              if (repeatable) {
                evs.forEach(e => {
                  const eventIndex = searchEvent(enrollmentEvents, stageEventFilters, stage, e);
                  if (eventIndex !== -1 && updateEvents) {
                    const stageEvent = enrollmentEvents[eventIndex];
                    const differingElements = _.differenceWith(e['dataValues'], stageEvent['dataValues'], (a, b) => {
                      return a.dataElement === b.dataElement && String(a.value) === String(b.value);
                    });
                    if (differingElements.length > 0) {
                      const mergedEvent = {
                        ...stageEvent,
                        dataValues: differingElements
                      };
                      eventsUpdate = [...eventsUpdate, mergedEvent];
                    }
                  } else if (eventIndex === -1 && createNewEvents) {
                    newEvents = [...newEvents, e];
                  }
                });
              } else {
                let foundEvent = _.find(enrollmentEvents, {
                  programStage: stage
                });
                let max = _.maxBy(evs, 'eventDate');
                if (foundEvent && updateEvents) {
                  const differingElements = _.differenceWith(max['dataValues'], foundEvent['dataValues'], (a, b) => {
                    return a.dataElement === b.dataElement && String(a.value) === String(b.value);
                  });
                  if (differingElements.length > 0) {
                    const mergedEvent = {
                      ...foundEvent,
                      dataValues: differingElements
                    };
                    eventsUpdate = [...eventsUpdate, mergedEvent];
                  }
                } else if (!foundEvent && createNewEvents) {
                  newEvents = [...newEvents, max];
                }
              }
            });
          }
        });
      } else if (createEntities) {
        orgUnits = _.uniq(orgUnits);
        let orgUnit;
        if (orgUnits.length > 1) {
          errors = [...errors, {
            error: 'Entity belongs to more than one organisation unit',
            row: client.client
          }]
        } else if (orgUnits.length === 1) {
          orgUnit = searchSourceOrgUnits(orgUnits[0], sourceOrganisationUnits);
          if (orgUnit && orgUnit.mapping) {
            const foundOrgUnitId = orgUnit.mapping.value;
            const trackedEntityInstance = generateUid();
            let tei = {
              orgUnit: foundOrgUnitId,
              attributes: allAttributes[0],
              trackedEntityInstance
            };

            if (trackedEntityType) {
              tei = {
                ...tei,
                trackedEntityType: trackedEntityType.id
              }
            } else if (trackedEntity && trackedEntity.id) {
              tei = {
                ...tei,
                trackedEntity: trackedEntity.id
              }
            }
            newTrackedEntityInstances = [...newTrackedEntityInstances, tei];

            if (createNewEnrollments && enrollmentDates.length > 0) {
              let enrollment = {
                orgUnit: foundOrgUnitId,
                program: id,
                trackedEntityInstance,
                ...enrollmentDates[0],
                enrollment: generateUid()
              };

              newEnrollments = [...newEnrollments, enrollment];

            }
            _.forOwn(groupedEvents, (evs, stage) => {
              const stageEventFilters = identifierElements[stage];
              const stageInfo = _.find(programStages, {
                id: stage
              });
              const {
                repeatable,
                createNewEvents
              } = stageInfo;
              evs = evs.map(e => {
                return {
                  ...e,
                  orgUnit: foundOrgUnitId,
                  event: generateUid(),
                  trackedEntityInstance
                }
              });
              evs = removeDuplicates(evs, stageEventFilters);

              if (createNewEvents) {
                if (!repeatable) {
                  newEvents = [...newEvents, _.maxBy(evs, 'eventDate')];
                } else {
                  newEvents = [...newEvents, ...evs]
                }
              }
            });
          } else {
            errors = [...errors, {
              error: 'Organisation unit ' + orgUnits[0] + ' not found using strategy ' +
                orgUnitStrategy.value,
              row: client.client
            }]
          }
        } else if (orgUnits.length === 0) {
          errors = [...errors, {
            error: 'Organisation unit missing',
            row: client.client
          }]
        }
      }
    });
  }

  return {
    newTrackedEntityInstances,
    newEnrollments,
    newEvents,
    trackedEntityInstancesUpdate,
    eventsUpdate,
    conflicts,
    duplicates,
    errors
  }
};

export const searchSavedEvent = (programStages, event, eventsData) => {
  const programStage = programStages[0];
  const {eventDateIdentifiesEvent, programStageDataElements, updateEvents, createNewEvents} = programStage;
  const identifiesEvents = programStageDataElements.filter(psde => {
    return psde.dataElement.identifiesEvent && psde.column;
  }).map(e => e.dataElement.id);
  const filtered = event.dataValues.filter(dv => {
    return identifiesEvents.indexOf(dv.dataElement) !== -1
  });
  const value = _.orderBy(filtered, ['dataElement'], ['asc']).map(dv => dv.value).join('@');
  const date = `${event.eventDate}${event.orgUnit}`;

  if (eventDateIdentifiesEvent && identifiesEvents.length > 0) {
    const currentEvent = eventsData[date + value];
    if (currentEvent && updateEvents) {
      const {event: ev2, many: many1} = currentEvent;
      if (ev2 && !many1) {

        const difference = event['dataValues'].filter(x => {
          const search = ev2['dataValues'].find(v => v.dataElement === x.dataElement);
          return (search && String(search.value) !== String(x.value));
        });

        const missing = event['dataValues'].filter(x => {
          const search = ev2['dataValues'].find(v => v.dataElement === x.dataElement);
          return !search;
        });
        if (difference.length > 0) {
          const updatedDataValues = ev2['dataValues'].map(dv => {
            const search = difference.find(v => v.dataElement === dv.dataElement);
            if (search) {
              dv = {...dv, value: search.value}
            }

            return dv;
          });
          return {
            ...ev2,
            eventDate: moment(ev2['eventDate']).format('YYYY-MM-DD'),
            update: true,
            duplicates: false,
            dataValues: [...updatedDataValues.filter(e => e.value !== ''), ...missing]
          };
        }
        return null;
      } else if (ev2 && many1) {
        return {...event, duplicates: true, value: value + date, update: false};
      } else {
        return {...event, update: false, duplicates: false};
      }
    } else if (createNewEvents) {
      return {...event, update: false, duplicates: false};
    } else {
      return null;
    }
  } else if (eventDateIdentifiesEvent) {
    const currentEvent = eventsData[date];
    if (currentEvent && updateEvents) {
      const {event: ev1, many: many1} = currentEvent;
      if (ev1 && !many1) {
        const difference = event['dataValues'].filter(x => {
          const search = ev1['dataValues'].find(v => v.dataElement === x.dataElement);
          return (search && String(search.value) !== String(x.value));
        });

        const missing = event['dataValues'].filter(x => {
          const search = ev1['dataValues'].find(v => v.dataElement === x.dataElement);
          return !search;
        });

        if (difference.length > 0) {
          const updatedDataValues = ev1['dataValues'].map(dv => {
            const search = difference.find(v => v.dataElement === dv.dataElement);
            if (search) {
              dv = {...dv, value: search.value}
            }

            return dv;
          });
          return {
            ...ev1,
            eventDate: moment(ev1['eventDate']).format('YYYY-MM-DD'),
            update: true,
            duplicates: false,
            dataValues: [...updatedDataValues.filter(e => e.value !== ''), ...missing]
          };
        }
      } else if (ev1 && many1) {
        return {...event, duplicates: true, value: date, update: false};
      } else {
        return {...event, update: false, duplicates: false};
      }
    } else if (createNewEvents) {
      return {...event, update: false, duplicates: false};
    } else {
      return null
    }
  } else if (identifiesEvents.length > 0) {
    const currentEvent = eventsData[value];
    if (currentEvent && updateEvents) {
      let {event: ev2, many: many1} = currentEvent;
      if (ev2 && !many1) {
        const difference = event['dataValues'].filter(x => {
          const search = ev2['dataValues'].find(v => v.dataElement === x.dataElement);
          return (search && String(search.value) !== String(x.value));
        });
        const missing = event['dataValues'].filter(x => {
          const search = ev2['dataValues'].find(v => v.dataElement === x.dataElement);
          return !search;
        });

        if (difference.length > 0) {
          const updatedDataValues = ev2['dataValues'].map(dv => {
            const search = difference.find(v => v.dataElement === dv.dataElement);
            if (search) {
              dv = {...dv, value: search.value}
            }

            return dv;
          });
          return {
            ...ev2,
            eventDate: moment(ev2['eventDate']).format('YYYY-MM-DD'),
            update: true,
            duplicates: false,
            dataValues: [...updatedDataValues.filter(e => e.value !== ''), ...missing]
          };
        }
        return null;
      } else if (ev2 && many1) {
        return {...event, duplicates: true, value, update: false};
      } else {
        return {...event, update: false, duplicates: false};
      }
    } else if (createNewEvents) {
      return {...event, update: false, duplicates: false};
    } else {
      return null;
    }
  } else if (createNewEvents) {
    return {...event, update: false, duplicates: false}
  } else {
    return null;
  }
};

export const processEvents = (program, data, eventsData) => {
  const {
    id,
    programStages,
    dataSource,
    orgUnitColumn,
    orgUnitStrategy,
    sourceOrganisationUnits,
    categoryCombo
  } = program;

  const stage = programStages[0];
  let conflicts = [];
  let errors = [];
  const events = data.map((d, i) => {
    let eventDate;
    let coordinate = null;
    let orgUnit;

    if (stage.eventDateColumn && (stage.createNewEvents || stage.updateEvents) && ['xlsx', 'xls'].indexOf(dataSource) !== -1) {
      const eDate = -2209075200000 + (d[stage.eventDateColumn.value] - (d[stage.eventDateColumn.value] < 61 ? 0 : 1)) * 86400000;
      const currentDate = new Date(eDate);
      const date = moment(currentDate);
      if (date.isValid()) {
        eventDate = date.format('YYYY-MM-DD');
      }
    } else if (stage.eventDateColumn && (stage.createNewEvents || stage.updateEvents)) {
      const date = moment(d[stage.eventDateColumn.value], 'YYYY-MM-DD');
      if (date.isValid()) {
        eventDate = date.format('YYYY-MM-DD');
      }
    }

    if (stage.latitudeColumn && stage.longitudeColumn) {
      coordinate = {
        latitude: d[stage.latitudeColumn.value],
        longitude: d[stage.longitudeColumn.value]
      };
    }

    const mapped = stage.programStageDataElements.filter(e => {
      return e.column && e.column.value
    });

    if (orgUnitColumn && orgUnitColumn !== '') {
      orgUnit = searchSourceOrgUnits(d[orgUnitColumn.value], sourceOrganisationUnits);
    }

    if (eventDate && mapped.length > 0) {
      const dataValues = mapped.map(e => {
        let value = d[e.column.value];
        const type = e.dataElement.valueType;
        const optionsSet = e.dataElement.optionSet;
        const validatedValue = validateValue(type, value, optionsSet);
        if (value !== '' && validatedValue) {
          return {
            dataElement: e.dataElement.id,
            value: validatedValue
          }
        } else if (!!value) {
          conflicts = [...conflicts, {
            error: optionsSet === null ? 'Invalid value ' + value + ' for value type ' + type : 'Invalid value: ' + value + ', expected: ' + _.map(optionsSet.options, o => {
              return o.code
            }).join(','),
            row: i + 2,
            column: e.column.value,
            id: `${i + 2}${e.column.value}`
          }];

          return null;
        } else {
          return null;
        }
      }).filter(e => e !== null);

      if (!orgUnit) {
        errors = [...errors, {
          error: 'Organisation unit ' + d[orgUnitColumn.value] + ' not found using strategy ' + orgUnitStrategy.value,
          row: i + 2
        }]
      }

      const rowData = categoryCombo.categories.map(category => {
        return d[category.mapping.value]
      });
      const found = findAttributeCombo(categoryCombo, rowData);

      let event = {
        dataValues,
        eventDate,
        orgUnit: orgUnit && orgUnit.mapping ? orgUnit.mapping.value : null,
        programStage: stage.id,
        program: id,
        event: generateUid(),
        row: i + 2
      };

      if (found) {
        event = {...event, attributeOptionCombo: found.id}
      }

      if (coordinate) {
        event = {
          ...event,
          coordinate,
          geometry: {
            type: 'Point',
            coordinate,
            coordinates: [coordinate.longitude, coordinate.latitude]
          }
        }
      }
      if (stage.completeEvents) {
        event = {
          ...event,
          ...{
            status: 'COMPLETED',
            completedDate: event['eventDate']
          }
        }
      }
      return event;
    }

    return null;
  }).filter(e => e !== null && e.orgUnit !== null).map((ev) => {
    return searchSavedEvent(programStages, ev, eventsData);
  })

  const foundConflicts = events.filter(e => e && e.duplicates === true).map(e => {
    return {
      error: `More than one event found with value ${e.value}, could not update all events expected to find one event`,
      row: e.row,
      column: '',
      id: `${e.row}`
    };
  });

  conflicts = [...conflicts, ...foundConflicts];

  const eventsUpdate = events.filter(e => e && e.update === true && e.duplicates === false).map(e => {
    return _.omit(e, ['update', 'duplicates', 'row']);
  });
  const newEvents = events.filter(e => e && e.update === false && e.duplicates === false).map(e => {
    return _.omit(e, ['update', 'duplicates', 'row']);
  });

  return {eventsUpdate, newEvents, conflicts, errors}
};
