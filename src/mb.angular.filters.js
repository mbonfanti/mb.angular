angular.module("mb.angular").filter('filtraTerms', function () {

    return function (items, idterm) {

        var out = '-';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.ID === idterm) {
                out = item.Name;
            }
        }
        return out;
    }


});
angular.module("mb.angular").filter('arrayObject', function () {

    return function (items, idterm) {

        var out = '-';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.ID === idterm) {
                out = item.Name;
            }
        }
        return out;
    }

});
angular.module("mb.angular").filter('filterDeep', function ($filter) {

    return function (items, key, val) {

        var out = '';
        for (var i = 0; i < items.length && out === ''; i++) {
            var item = items[i];
            if (item[key] === val) {
                out = item;
                break
            }
            out = $filter('filterDeep')(items[i].children, key, val);
        }
        return out;

    }

});
angular.module("mb.angular").filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
