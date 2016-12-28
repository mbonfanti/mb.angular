
angular.module("mb.angular").factory("logSvc", ['baseSvc', 'itemsSvc', '$http', function (baseSvc, itemsSvc, $http) {

    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.urlListaLog = '/manager';

    factory.logNotification = function (opt, stick) {

        function ShowDialog() {
            SP.UI.Notify.addNotification(opt, stick);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.js");
    }

    // Gestione degli errori
    /// con -> se esce anche in console
    /// ale -> se geenra anche un alert
    factory.logError = function (w, title, message, level, con, ale) {
        try {
            var m = {}
            m.Title = "ERROR";
            m.LogMessage = JSON.stringify(message).toString();
            m.LogLevel = 'medium';
            m.App = 'Space';
            m.LinkUrl = w;

            if (con) {
                console.log(message)
            }
            if (ale) {
                alert('Errore: ' + message)
            }
            return itemsSvc.addListItem(factory.urlListaLog, "AppLog", m)

        } catch (exception) {

            console.log('Non è possbile salavre i log: ' + exception.message)
        }
    }


    return factory;
}])