const Constants = {
  DEFAULT_LIMIT: 20
}
Constants.install = function (Vue) {
  Vue.prototype.$getConst = (key) => {
    return Constants[key]
  }
}
export default Constants
