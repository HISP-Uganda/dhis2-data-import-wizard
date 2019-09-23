import XLSX from "xlsx";
import _ from 'lodash';
import { nest } from './utils'

export const processMergedCells = (mergedCells, data, mergedCell, processed, dataElement) => {
    const merged = mergedCells.filter(e => {
        return e.s.r === mergedCell.s.r + 1 && e.s.c >= mergedCell.s.c && e.e.c <= mergedCell.e.c;
    });

    if (merged.length > 0) {
        merged.forEach(val => {
            const cell_address = {
                c: val.s.c,
                r: val.s.r
            };
            const cell_ref = XLSX.utils.encode_cell(cell_address);

            if (mergedCell.previous) {
                val.previous = mergedCell.previous + ', ' + data[cell_ref]['v'];
            } else {
                val.previous = data[cell_ref]['v'];
            }
            processed = processMergedCells(mergedCells, data, val, processed, dataElement);
        });
    } else {

        if (mergedCell.s.c === mergedCell.e.c) {
            let column = {
                column: XLSX.utils.encode_col(mergedCell.s.c),
                name: dataElement
            };
            processed = [...processed, column];

        } else {
            for (let i = mergedCell.s.c; i <= mergedCell.e.c; i++) {
                const cell_address = {
                    c: i,
                    r: mergedCell.s.r + 1
                };
                const cell_ref = XLSX.utils.encode_cell(cell_address);

                if (data[cell_ref]) {
                    let column = {
                        column: XLSX.utils.encode_col(i),
                        name: dataElement + " " + data[cell_ref]['v']
                    };
                    if (mergedCell.previous) {
                        column = {
                            ...column,
                            name: dataElement + " " + mergedCell.previous + ', ' + data[cell_ref]['v']
                        }
                    }

                    processed = [...processed, column];
                }
            }
        }
    }
    return processed;
};

export const excelColumns = (workSheet, headerRow) => {
    const range = XLSX.utils.decode_range(workSheet['!ref']);
    return _.range(0, range.e.c + 1).map(v => {
        const cell = XLSX.utils.encode_cell({ r: headerRow - 1, c: v });
        const cellValue = workSheet[cell];
        if (cellValue) {
            return { label: cellValue.v.toString(), value: cellValue.v.toString() };
        } else {
            return { label: '', value: '' };
        }
    }).filter(c => {
        return c.label !== '';
    });
}


export const excelMergedData = (mergedCells, data, cellColumns, headerRow, dataStartColumn) => {
    let processed = [];
    mergedCells.filter(e => {
        return e.s.r === headerRow - 1
    }).sort().forEach(val => {
        const cell_address = { c: val.s.c, r: val.s.r };
        const cell_ref = XLSX.utils.encode_cell(cell_address);

        const dataElement = data[cell_ref]['v'];

        processed = processMergedCells(mergedCells, data, val, processed, dataElement);
    });

    const others = cellColumns.map(col => {
        const cell = col.value + headerRow;
        const name = data[cell];
        return { name: name ? name['v'] : null, column: col.value };
    }).filter(d => {
        const match = processed.find(p => {
            return p.column === d.column;
        });
        return d.name !== null && d.column > dataStartColumn.value && !match;
    });

    processed = [...processed, ...others];

    const sorter = (a, b) => (a['name'] < b['name'] ? -1 : 1);
    return processed.sort(sorter);
}

export const excelCells = (workSheet) => {
    let foundCells = [];
    const range = XLSX.utils.decode_range(workSheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);

            foundCells = [...foundCells, { label: cell_ref, value: cell_ref }];
        }
    }
    return foundCells;
}

export const excelRows = (workSheet, dataStartRow) => {
    const range = XLSX.utils.decode_range(workSheet['!ref']);
    return _.range(dataStartRow, range.e.r + 2)

}

export const excelCellColumns = (workSheet) => {
    const range = XLSX.utils.decode_range(workSheet['!ref']);
    return _.range(0, range.e.c + 1).map(v => {
        const cell_ref = XLSX.utils.encode_col(v);
        return { label: cell_ref, value: cell_ref }
    });
}

export const excelRawData = (workSheet, headerRow) => {
    return XLSX.utils.sheet_to_json(workSheet, {
        range: headerRow - 1,
        dateNF: 'YYYY-MM-DD'
    });
}

export const excelData = (workSheet, headerRow = 1, dataElementColumn = null) => {
    if (dataElementColumn) {
        const data = excelRawData(workSheet, headerRow)
        return nest(data, [dataElementColumn.value]);
    } else {
        const cells = excelCells(workSheet);
        if (cells.length > 0) {
            return _.fromPairs(cells.map(c => {
                return [c.value, workSheet[c.value]]
            }));
        }
    }
}