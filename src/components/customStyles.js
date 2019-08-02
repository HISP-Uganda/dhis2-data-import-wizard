export default {
    // control: (base, state) => ({
    //     ...base,
    //     // match with the menu
    //     borderRadius: state.isFocused ? "3px 3px 0 0" : 3,
    //     // Overwrittes the different states of border
    //     borderColor: state.isFocused ? "yellow" : "green",
    //     // Removes weird border around container
    //     boxShadow: state.isFocused ? null : null,
    //     "&:hover": {
    //         // Overwrittes the different states of border
    //         borderColor: state.isFocused ? "red" : "blue"
    //     }
    // }),
    menu: base => ({
        ...base,
        // override border radius to match the box
        borderRadius: 0,
        // background: 'yellow',
        zIndex: 25,
        // kill the gap
        marginTop: 0
    }),
    menuList: base => ({
        ...base,
        // kill the white space on first and last option
        padding: 0
    })
};
