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
        name: 'repeating_first',
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

on('change:repeating_first', (eventinfo) => {
    console.log('change:repeating_first', eventinfo);
    const { id } = parseEvent(eventinfo);
    getAttrs(repeatingSections.first.getAttrs(id), (values) => {
        const data = repeatingSections.first.getValues(id, values);
        console.log(data);
        const sourceId = id;
        let targetId = data.targetId;
        let sourceSyncIds = {};
        if (!targetId) {
            targetId = generateRowID();
            sourceSyncIds = {
                [`repeating_first_${sourceId}_sourceId`]: sourceId,
                [`repeating_first_${sourceId}_targetId`]: targetId
            };
        }
        const syncId = {
            ...sourceSyncIds,
            [`repeating_second_${targetId}_sourceId`]: targetId,
            [`repeating_second_${targetId}_targetId`]: sourceId
        };
        const syncData = {
            [`repeating_second_${targetId}_count`]: data.count,
            [`repeating_second_${targetId}_name`]: data.name
        };
        console.log(syncData);
        setAttrs(
            syncId,
            { silent: true },
            () => {
                console.log('setAttrs', syncId);
                setAttrs(
                    syncData,
                    { silent: false },
                    () => {
                        console.log('setAttrs', syncData);
                    }
                );
            }
        );
    })
});

on('change:repeating_second', (eventinfo) => {
    console.log('change:repeating_second', eventinfo);
    const { id } = parseEvent(eventinfo);
    getAttrs(repeatingSections.second.getAttrs(id), (values) => {
        const data = repeatingSections.second.getValues(id, values);
        console.log(data);
        const sourceId = id;
        let targetId = data.targetId;
        let sourceSyncIds = {};
        if (!targetId) {
            targetId = generateRowID();
            sourceSyncIds = {
                [`repeating_second_${sourceId}_sourceId`]: sourceId,
                [`repeating_second_${sourceId}_targetId`]: targetId
            };
        }
        const syncId = {
            ...sourceSyncIds,
            [`repeating_first_${targetId}_sourceId`]: targetId,
            [`repeating_first_${targetId}_targetId`]: sourceId
        };
        const syncData = {
            [`repeating_first_${targetId}_count`]: data.count,
            [`repeating_first_${targetId}_name`]: data.name
        };
        console.log(syncData);
        setAttrs(
            syncId,
            { silent: true },
            () => {
                console.log('setAttrs', syncId);
                setAttrs(
                    syncData,
                    { silent: false },
                    () => {
                        console.log('setAttrs', syncData);
                    }
                );
            }
        );
    })
});