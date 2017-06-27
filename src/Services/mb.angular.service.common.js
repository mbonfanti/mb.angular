
angular.module("mb.angular").factory("commonSvc", ['baseSvc', '$http', function (baseSvc, $http) {
    var factory = {};
    //factory.getWeb = function (exportUrl) {
    //    return $http.get(exportUrl);
    //}
    factory.resultsToObjectAll = function (ris,key) {
        var temp = {}
        for (i = 0; i < ris.length; i++) {
            temp[ris[i][key]] = ris[i]
        }
        return temp;
    }

    factory.resultsToObject = function (ris,key,value) {
        var temp = {}
        for (i = 0; i < ris.length; i++) {
            temp[ris[i][key]] = ris[i][value]
        }
        return temp;
    }


    factory.getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    factory.imageExists = function (image_url) {

        var img = new Image();
        img.src = image_url;
        return img.height !== 0;

    }

    factory.modalOptions = function (opt) {

        function ShowDialog() {

            SP.UI.ModalDialog.showModalDialog(options);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.ui.dialog.js");
    }

    factory.logNotification = function (opt, stick) {

        function ShowDialog() {
            SP.UI.Notify.addNotification(opt, stick);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.js");
    }

    factory.arrayContiene = function (arr, k) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].Title === k) {
                return true;
            }
        }
        return false;
    }

    factory.filtraArrayObject = function (arr, chiave, valore) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][chiave] === valore) {
                return arr[i];
            }
        }
        return "";
    }

    // Utility
    return factory;
}])