const {
    override,
    disableEsLint,
    addDecoratorsLegacy,
    fixBabelImports
} = require("customize-cra");


const addWebpackTarget = () => config => {
    config.output.globalObject = "self";
    return config
};

module.exports = override(
    addWebpackTarget(),
    disableEsLint(),
    addDecoratorsLegacy(),
    fixBabelImports("react-app-rewire-mobx", {
        libraryDirectory: "",
        camel2DashComponentName: false
    }),
);
