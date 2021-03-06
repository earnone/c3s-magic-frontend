import { getConfig } from '../getConfig';
let config = getConfig();

export const getKeys = function (obj) {
  if (!Object.keys) {
    let keys = [];
    let k;
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        keys.push(k);
      }
    }
    return keys;
  } else {
    return Object.keys(obj);
  }
};

var _stripNS = function (newObj, obj) {
  var keys = getKeys(obj);

  for (var j = 0; j < keys.length; j++) {
    var key = keys[j];
    var i = key.indexOf(':');
    var newkey = key.substring(i + 1);
    var value = obj[key];
    if (typeof value === 'object') {
      newObj[newkey] = {};
      _stripNS(newObj[newkey], value);
    } else {
      newObj[newkey] = value;
    }
  }
};

export const stripNS = function (currentObj) {
  var newObj = {};
  _stripNS(newObj, currentObj);
  return newObj;
};

export const doWPSCall = function (wps, callback, failure) {
  doXML2JSONCallWithToken(wps, callback, failure);
};

export const doWPSExecuteCall = function (wps, statusCallBack, executeCompleteCallBack, failure) {
  console.log('start');
  statusCallBack('Starting WPS', 0);

  /* Returns true if there was an error */
  let handleExceptions = (json) => {
    let percentageComplete = 0;
    let message = null;

    if (json.error) {
      message = 'Failed, unable to get message';
      if (json.error) {
        message = json.error;
        statusCallBack(message, percentageComplete);
        executeCompleteCallBack(json, false);
        if (failure) {
          failure(message);
        }
        console.log('json.error set', json);
        return true;
      }
    }

    try {
      message = json.ExecuteResponse.Status.ProcessFailed;
    } catch (e) {
    }

    try {
      message = json.ExecuteResponse.Status.ProcessFailed.ExceptionReport.Exception.ExceptionText.value;
    } catch (e) {
    }
    try {
      message = json.ExceptionReport.Exception.ExceptionText.value;
    } catch (e) {
    }
    if (message) {
      statusCallBack(message, percentageComplete);
      executeCompleteCallBack(json, false);
      console.log('message set', message);
      return true;
    }

    return false;
  };

  let wpsExecuteCallback = (executeResponse) => {
    console.log(wpsExecuteCallback);
    if (handleExceptions(executeResponse) === true) {
      console.log('Exception in WPS Process');
      return;
    }
    console.log(executeResponse);
    let statusLocation = executeResponse.ExecuteResponse.attr.statusLocation;
    let processIsRunning = true;
    let pol = () => {
      if (processIsRunning === false) {
        return;
      }
      let pollCallBack = (json) => {
        let percentageComplete = 0;
        let message = '';

        /* Check processfailed */
        if (handleExceptions(json)) {
          processIsRunning = false;
          return;
        }

        try {
          percentageComplete = json.ExecuteResponse.Status.ProcessStarted.attr.percentCompleted;
          message = json.ExecuteResponse.Status.ProcessStarted.value;
        } catch (e) {
        }

        let processCompleted = false;

        try {
          message = json.ExecuteResponse.Status.ProcessSucceeded.value;
          if (message) {
            percentageComplete = 100;
            processIsRunning = false;
            statusCallBack(message, percentageComplete);
            executeCompleteCallBack(json, true);
            return;
          }
        } catch (e) {
        }
        if (processCompleted === false) {
          statusCallBack(message, percentageComplete);
        }
      };
      doXML2JSONCallWithToken(statusLocation, pollCallBack, failure);
      setTimeout(pol, 300);
    };
    pol();
  };
  doXML2JSONCallWithToken(wps, wpsExecuteCallback, failure);
};

const doXML2JSONCallWithToken = function (urlToXMLService, callback, failure) {
  // let encodedWPSURL = encodeURIComponent(urlToXMLService
  let encodedWPSURL = encodeURIComponent(urlToXMLService);
  let requestURL = config.backendHost + '/xml2json?request=' + encodedWPSURL + '&rand=' + Math.random();
  console.log(requestURL);
  fetch(requestURL, {
    credentials: 'include'
  }).then(function (response) {
    let a = response.json();
    return a;
  }).then(json => {
    if (json.error) {
      if (failure) {
        failure(json);
      } else {
        callback(json);
      }
      return;
    }
    let strippedJSON = stripNS(json);
    callback(strippedJSON);
  }).catch(function (data) {
    if (failure) {
      failure(data);
    } else {
      callback(data, false);
    }
  });
};
