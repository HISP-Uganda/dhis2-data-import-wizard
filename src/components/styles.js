const drawerWidth = 240;
const styles = theme => ({
    root: {
        display: "flex",
    },
    toolbar: {
        paddingRight: 24
    },
    toolbarIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        marginTop: 48,
        ...theme.mixins.toolbar
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        })
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 36
    },
    menuButtonHidden: {
        display: "none"
    },
    title: {
        flexGrow: 1
    },
    drawerPaper: {
        position: "relative",
        whiteSpace: "nowrap",
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        }),
        height: "100vh",
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        width: '100%',
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9
        },
        height: "100vh",
    },
    // appBarSpacer: theme.mixins.toolbar,
    appBarSpacer: {marginTop: 48},
    content: {
        // width: '90%',
        flexGrow: 1,
        padding: theme.spacing.unit,
        height: "98.5vh",
        // overflow: "auto"
    },
    chartContainer: {
        marginLeft: -22
    },
    tableContainer: {
        height: 320
    },
    icon: {
        margin: theme.spacing.unit * 2
    }
});


export default styles
