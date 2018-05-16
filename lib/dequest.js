'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createResponseSelectorsByKey = exports.createResponseSelectors = exports.defaultMiddleware = exports.createMiddleware = exports.defaultReducer = exports.$selectResponse = exports.invalidateRequest = exports.makeRequest = exports.patch = exports.Delete = exports.put = exports.post = exports.get = exports.HandledRequest = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _reselect = require('reselect');

var _promiseDedupe = require('promise-dedupe');

var _promiseDedupe2 = _interopRequireDefault(_promiseDedupe);

var _promiseTimeout = require('@trungdq88/promise-timeout');

var _promiseTimeout2 = _interopRequireDefault(_promiseTimeout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var REDUCER_NAMESPACE = '@@dequest';
var DEFAULT_TIMEOUT = 10000; // 10 secs

var Dequest = function Dequest(requestId, request) {
  _classCallCheck(this, Dequest);

  this.requestId = requestId;
  this.request = request;
};

var HandledRequest = exports.HandledRequest = function HandledRequest() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      type = _ref.type,
      args = _ref.args;

  _classCallCheck(this, HandledRequest);

  this.type = type;
  this.args = args;
};

var get = exports.get = function get() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new HandledRequest({ type: 'get', args: args });
};
var post = exports.post = function post() {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return new HandledRequest({ type: 'post', args: args });
};
var put = exports.put = function put() {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return new HandledRequest({ type: 'put', args: args });
};
var Delete = exports.Delete = function Delete() {
  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  return new HandledRequest({ type: 'delete', args: args });
}; // damn, delete is reserved
var patch = exports.patch = function patch() {
  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  return new HandledRequest({ type: 'patch', args: args });
};

var makeRequest = exports.makeRequest = function makeRequest(requestId, request) {
  return new Dequest(requestId, request);
};

var invalidateRequest = exports.invalidateRequest = function invalidateRequest(requestId) {
  return {
    type: '@@DEQUEST/INVALIDATE',
    requestId: requestId
  };
};

var $selectResponse = exports.$selectResponse = (0, _reselect.createSelector)(function (state) {
  return state;
}, function (state) {
  return state[REDUCER_NAMESPACE];
});

var defaultReducer = exports.defaultReducer = _defineProperty({}, REDUCER_NAMESPACE, function () {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case '@@DEQUEST/SEND':
      return Object.assign({}, state, _defineProperty({}, action.requestId, {
        isLoading: true,
        requestAt: action.requestAt,
        responseAt: null
      }));
    case '@@DEQUEST/RECEIVE':
      return Object.assign({}, state, _defineProperty({}, action.requestId, Object.assign({}, state[action.requestId], action.data, {
        isLoading: false,
        isUpdating: false,
        responseAt: action.responseAt
      })));
    case '@@DEQUEST/UPDATE':
      return Object.assign({}, state, _defineProperty({}, action.requestId, Object.assign({}, state[action.requestId], {
        isUpdating: true,
        requestAt: action.requestAt,
        responseAt: null
      })));
    case '@@DEQUEST/INVALIDATE':
      return Object.assign({}, state, _defineProperty({}, action.requestId, undefined));
    default:
      return state;
  }
});

var resolveRequest = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee(api, action) {
    var type, method;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(action.request instanceof HandledRequest)) {
              _context.next = 8;
              break;
            }

            if (api) {
              _context.next = 3;
              break;
            }

            throw new Error('Dequest: custom api is not defined');

          case 3:
            type = action.request.type;
            method = api[type];

            if (method) {
              _context.next = 7;
              break;
            }

            throw new Error('Dequest: method ' + type + ' not registered in custom api');

          case 7:
            return _context.abrupt('return', method.apply(undefined, _toConsumableArray(action.request.args)));

          case 8:
            return _context.abrupt('return', action.request);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function resolveRequest(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var createMiddleware = exports.createMiddleware = function createMiddleware() {
  var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref3$requestTransfor = _ref3.requestTransformer,
      requestTransformer = _ref3$requestTransfor === undefined ? function (_) {
    return Promise.resolve(_);
  } : _ref3$requestTransfor,
      api = _ref3.api;

  return function (store) {
    return function (next) {
      return function (action) {
        if (!(action instanceof Dequest)) {
          return next(action);
        }

        var requestAt = Date.now();

        var _createResponseSelect = createResponseSelectorsByKey(action.requestId),
            $isFinished = _createResponseSelect.$isFinished;

        if ($isFinished(store.getState())) {
          store.dispatch({
            type: '@@DEQUEST/UPDATE',
            requestId: action.requestId,
            requestAt: requestAt
          });
        } else {
          store.dispatch({
            type: '@@DEQUEST/SEND',
            requestId: action.requestId,
            requestAt: requestAt
          });
        }

        return requestTransformer((0, _promiseDedupe2.default)(action.requestId, (0, _promiseTimeout2.default)(resolveRequest(api, action), DEFAULT_TIMEOUT, {
          errorMessage: 'Connection timeout'
        }))).then(function (r) {
          return store.dispatch({
            type: '@@DEQUEST/RECEIVE',
            requestId: action.requestId,
            data: r,
            responseAt: Date.now()
          });
        }).catch(function (error) {
          console.error(error);
          throw new Error('Error: promise rejected. ' + 'Dequest requires request promise to always resolves!');
        });
      };
    };
  };
};

var defaultMiddleware = exports.defaultMiddleware = createMiddleware();

var createResponseSelectors = exports.createResponseSelectors = function createResponseSelectors($response) {
  var $isStarted = (0, _reselect.createSelector)($response, function (response) {
    return !!response;
  });

  var $isLoading = (0, _reselect.createSelector)($isStarted, $response, function (isStarted, response) {
    return isStarted && response.isLoading === true;
  });

  var $isUpdating = (0, _reselect.createSelector)($response, function (response) {
    return response && response.isUpdating === true;
  });

  var $isSuccess = (0, _reselect.createSelector)($response, function (response) {
    return response && response.ok;
  });

  var $isError = (0, _reselect.createSelector)($isLoading, $response, function (isLoading, response) {
    return !isLoading && response && (response.ok === false || !!response.exception);
  });

  var $body = (0, _reselect.createSelector)($response, function (response) {
    return response && response.jsonBody;
  });

  var $error = (0, _reselect.createSelector)($response, function (response) {
    return response && (response.jsonBody || response.exception);
  });

  var $exception = (0, _reselect.createSelector)($response, function (response) {
    return response && response.exception;
  });

  var $isFinished = (0, _reselect.createSelector)($response, function (response) {
    return response && response.ok !== undefined;
  });

  var $requestAt = (0, _reselect.createSelector)($response, function (response) {
    return response && response.requestAt;
  });

  var $responseAt = (0, _reselect.createSelector)($response, function (response) {
    return response && response.responseAt;
  });

  var $requestDuration = (0, _reselect.createSelector)($requestAt, $responseAt, function (requestAt, responseAt) {
    return !!requestAt && !!responseAt ? responseAt - requestAt : null;
  });

  var $statusCode = (0, _reselect.createSelector)($response, function (response) {
    return response && response.status;
  });

  return {
    $isStarted: $isStarted,
    $isUpdating: $isUpdating,
    $isFinished: $isFinished,
    $isLoading: $isLoading,
    $isSuccess: $isSuccess,
    $body: $body,
    $isError: $isError,
    $error: $error,
    $exception: $exception,
    $requestAt: $requestAt,
    $responseAt: $responseAt,
    $requestDuration: $requestDuration,
    $statusCode: $statusCode
  };
};

var createResponseSelectorsByKey = exports.createResponseSelectorsByKey = function createResponseSelectorsByKey(key) {
  var $response = (0, _reselect.createSelector)($selectResponse, function (selectResponse) {
    return selectResponse[key];
  });

  var selectors = Object.assign({
    $response: $response
  }, createResponseSelectors($response));

  return selectors;
};

exports.default = {
  reducer: defaultReducer,
  middleware: defaultMiddleware,
  createMiddleware: createMiddleware
};