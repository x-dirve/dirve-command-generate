var Vue = require('vue')

module.exports = Vue.extend({
    template: __inline('./_view/<$= filename $>.tpl'),
    data: function() {
        return {}
    },
    beforeDestroy: function() {

    },
    created: function() {

    },
    route: {
        data: function(transition) {

        }
    },
    methods: {
        
    },
    components: {
        
    }
})