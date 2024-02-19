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
            syncId: '',
            name: '',
            count: 0
        },
        getValues: (id, values) => ({
            syncId: values[`${repeatingSections.first.name}_${id}_syncId`],
            name: values[`${repeatingSections.first.name}_${id}_name`],
            count: values[`${repeatingSections.first.name}_${id}_count`],
        }),
        getAttrs: (id) => Object.keys(repeatingSections.first.attrs).map( key => `${repeatingSections.first.name}_${id}_${key}`)
    },
    second: {
        name: 'repeating_first',
        attrs: {
            syncId: '',
            name: '',
            count: 0
        },
        getValues: (id, values) => ({
            syncId: values[`${repeatingSections.second.name}_${id}_syncId`],
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
        const value = repeatingSections.first.getValues(id, values);
        console.log(value.syncId);

        getSectionIDs('second', (idarray) => {
           console.log(idarray);
           const ids = [];
           idarray.forEach( id => {
               ids.push(`repeating_first_${id}_count`);
               ids.push(`repeating_first_${id}_name`);
               ids.push(`repeating_first_${id}_syncId`);
               ids.push(`repeating_first_${id}_id`);
           });

           getAttrs(ids, values => {
               console.log({values});
           });

        });
    })
});

on('change:repeating_second', (eventinfo) => {
    console.log('change:repeating_second', eventinfo);
    getSectionIDs('first', (idarray) => {
       console.log(idarray);
       const ids = [];
       idarray.forEach( id => {
           ids.push(`repeating_second_${id}_count`);
           ids.push(`repeating_second_${id}_name`);
           ids.push(`repeating_second_${id}_syncId`);
           ids.push(`repeating_second_${id}_id`);
       });
       getAttrs(ids, values => {
           console.log({values});
       })
    });
});