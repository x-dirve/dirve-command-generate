var Vue = require('vue')

module.exports = Vue.extend({
    template: __inline('./<$= filename $>.tpl'),
    props: {}
})