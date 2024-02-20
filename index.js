const parseEvent = (eventInfo) => {
    const arr = eventInfo.sourceAttribute.split('_');
    return {
        id: arr[2],
        sectionName: `${String(arr[0])}_${String(arr[1])}`,
        changedAttribute: arr[3],
        newValue: eventInfo.newValue,
        previousValue: eventInfo.previousValue,
        removedInfo: eventInfo.removedInfo
    };
};

const attributes = {
    emptyText: "",
    settedText: "settedText",
    emptyNumber: "",
    settedNumber: "6",
    falseBoolean: "0",
    trueBoolean: "1",
    enumNotSelected: "",
    enumSelected: "Člověk",
    radioNotSelected: "",
    radioSelected: "5",
    emptyTextarea: "",
    settedTextarea: "settedText",
    totalCount: "0"
};

const repeatingSections = {
    first: {
        name: 'repeating_first',
        attrs: {
            sourceId: '',
            targetId: '',
            name: '',
            count: 0
        },
        getValues: (id, values) => ({
            sourceId: values[`${repeatingSections.first.name}_${id}_sourceId`],
            targetId: values[`${repeatingSections.first.name}_${id}_targetId`],
            name: values[`${repeatingSections.first.name}_${id}_name`],
            count: values[`${repeatingSections.first.name}_${id}_count`],
        }),
        getAttrs: (id) => Object.keys(repeatingSections.first.attrs).map( key => `${repeatingSections.first.name}_${id}_${key}`)
    },
    second: {
        name: 'repeating_second',
        attrs: {
            sourceId: '',
            targetId: '',
            name: '',
            count: 0
        },
        getValues: (id, values) => ({
            sourceId: values[`${repeatingSections.second.name}_${id}_sourceId`],
            targetId: values[`${repeatingSections.second.name}_${id}_targetId`],
            name: values[`${repeatingSections.second.name}_${id}_name`],
            count: values[`${repeatingSections.second.name}_${id}_count`],
        }),
        getAttrs: (id) => Object.keys(repeatingSections.second.attrs).map( key => `${repeatingSections.second.name}_${id}_${key}`)
    }
}

on("sheet:opened", (eventinfo) => {
    console.log('sheet opened', eventinfo);
    
    // Load sheet attributes
    getAttrs(Object.keys(attributes), (values) => {
        console.log('default values', { values });
        
        // Clone Default Attributes and write them
        const data = JSON.parse(JSON.stringify(attributes));
        setAttrs(
            data,
            { silent: true },
            () => {
                console.log('setAttrs', data);
            }
        );
    })
});

// Create event listeneres on default attributes changes
Object.keys(attributes).forEach( (attribute) => {
    on(`change:${attribute}`, (eventinfo) => {
        console.log(`change:${attribute}`, { 'new': eventinfo.newValue, 'previous': eventinfo.previousValue, ...eventinfo });
        
        // Load Real Value
        getAttrs([`${attribute}`], (values) => {
            console.log('getAttrs', { [attribute]: values[attribute] });
            
            // Write EventInfo newValue to diferrent attributen to display
            const data = {
                [`${attribute}Worker`]: `${eventinfo.newValue}`
            };
            setAttrs(
                data,
                { silent: false },
                () => {
                    console.log('setAttrs', data);
                }
            );
        });
    });
});

const getSectionIDsOrdered = function (sectionName, callback) {
    'use strict';
    getAttrs([`_reporder_${sectionName}`], function (v) {
      getSectionIDs(sectionName, function (idArray) {
        let reporderArray = v[`_reporder_${sectionName}`] ? v[`_reporder_${sectionName}`].toLowerCase().split(',') : [],
          ids = [...new Set(reporderArray.filter(x => idArray.includes(x)).concat(idArray))];
        callback(ids);
      });
    });
  };

on('change:repeating_first', (eventinfo) => {
    console.log('change:repeating_first', eventinfo);
    const { id, changedAttribute, sectionName } = parseEvent(eventinfo);
    if (changedAttribute === 'synced') {
        const data = {
            [`totalCount`]: 10
        };
        setAttrs(
            data,
            { silent: false },
            () => {
                console.log('setAttrs', data);
            }
        );
    } else {
        getAttrs(repeatingSections.first.getAttrs(id), (values) => {
            getSectionIDsOrdered(repeatingSections.first.name, (ids) => {
                console.log('ids', ids);
            });
            console.log({values});
            const data = repeatingSections.first.getValues(id, values);
            console.log({data});
            const targetSectionName = 'repeating_second';
            const sourceId = id;
            let targetId = data.targetId;
            let sourceSyncIds = {};
            if (targetId === '') {
                targetId = generateRowID();
                sourceSyncIds = {
                    [`${sectionName}_${sourceId}_sourceId`]: sourceId,
                    [`${sectionName}_${sourceId}_targetId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_sourceId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_targetId`]: sourceId,
                };
            }
            // sync everything silent
            const syncData = {
                ...sourceSyncIds,
                [`${targetSectionName}_${targetId}_${changedAttribute}`]: data[changedAttribute]
            };
            // tell repeating second that it is synced, to recalculate computed values
            const synced = {
                [`${targetSectionName}_${targetId}_synced`]: '1'
            }
            setAttrs(
                syncData,
                { silent: true },
                () => {
                    console.log('setAttrs', syncData);
                    setAttrs(
                        synced,
                        { silent: false },
                        () => {
                            console.log('setAttrs', synced);
                        }
                    );
                }
            );
        })
    }
});

on('change:repeating_second', (eventinfo) => {
    console.log('change:repeating_second', eventinfo);
    const { id, changedAttribute, sectionName } = parseEvent(eventinfo);
    if (changedAttribute === 'synced') {
        const data = {
            [`totalCount`]: 10
        };
        setAttrs(
            data,
            { silent: false },
            () => {
                console.log('setAttrs', data);
            }
        );
    } else {
        getAttrs(repeatingSections.second.getAttrs(id), (values) => {
            getSectionIDsOrdered(repeatingSections.second.name, (ids) => {
                console.log('ids', ids);
            });
            console.log({values});
            const data = repeatingSections.second.getValues(id, values);
            console.log({data});
            const targetSectionName = 'repeating_first';
            const sourceId = id;
            let targetId = data.targetId;
            let sourceSyncIds = {};
            if (targetId === '') {
                targetId = generateRowID().toLowerCase();
                sourceSyncIds = {
                    [`${sectionName}_${sourceId}_sourceId`]: sourceId,
                    [`${sectionName}_${sourceId}_targetId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_sourceId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_targetId`]: sourceId,
                };
            }
            // sync everything silent
            const syncData = {
                ...sourceSyncIds,
                [`${targetSectionName}_${targetId}_${changedAttribute}`]: data[changedAttribute]
            };
            // tell repeating second that it is synced, to recalculate computed values
            const synced = {
                [`${targetSectionName}_${targetId}_synced`]: '1'
            }
            setAttrs(
                syncData,
                { silent: true },
                () => {
                    console.log('setAttrs', syncData);
                    setAttrs(
                        synced,
                        { silent: false },
                        () => {
                            console.log('setAttrs', synced);
                        }
                    );
                }
            );
        });
    }
});