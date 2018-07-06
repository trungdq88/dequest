import _regeneratorRuntime from 'babel-runtime/regenerator';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _this = this;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { createSelector } from 'reselect';
import dedupe from 'promise-dedupe';
import timeout from '@trungdq88/promise-timeout';

export var configs = {
  REDUCER_NAMESPACE: '@@dequest',
  DEFAULT_TIMEOUT: 10000 // 10 secs
};

var Dequest = function Dequest(requestId, request) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      overrideTransform = _ref.overrideTransform;

  _classCallCheck(this, Dequest);

  this.requestId = requestId;
  this.request = request;
  this.options = { overrideTransform: overrideTransform };
};

export var HandledRequest = function HandledRequest() {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      type = _ref2.type,
      args = _ref2.args;

  _classCallCheck(this, HandledRequest);

  this.type = type;
  this.args = args;
};

export var get = function get() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new HandledRequest({ type: 'get', args: args });
};
export var post = function post() {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return new HandledRequest({ type: 'post', args: args });
};
export var put = function put() {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return new HandledRequest({ type: 'put', args: args });
};
export var Delete = function Delete() {
  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  return new HandledRequest({ type: 'delete', args: args });
}; // damn, delete is reserved
export var patch = function patch() {
  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  return new HandledRequest({ type: 'patch', args: args });
};

export var makeRequest = function makeRequest(requestId, request) {
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref3$overrideTransfo = _ref3.overrideTransform,
      overrideTransform = _ref3$overrideTransfo === undefined ? false : _ref3$overrideTransfo;

  return new Dequest(requestId, request, { overrideTransform: overrideTransform });
};

export var invalidateRequest = function invalidateRequest(requestId) {
  return {
    type: '@@DEQUEST/INVALIDATE',
    requestId: requestId
  };
};

export var $selectResponse = createSelector(function (state) {
  return state;
}, function (state) {
  return state[configs.REDUCER_NAMESPACE];
});

export var defaultReducer = _defineProperty({}, configs.REDUCER_NAMESPACE, function () {
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
        exception: null,
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
  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(api, action) {
    var type, method;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
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
            return _context.abrupt('return', method(action));

          case 8:
            return _context.abrupt('return', action.request);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this);
  }));

  return function resolveRequest(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

var noOpTransformer = function noOpTransformer(_) {
  return Promise.resolve(_);
};

export var createMiddleware = function createMiddleware() {
  var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref5$requestTransfor = _ref5.requestTransformer,
      requestTransformer = _ref5$requestTransfor === undefined ? noOpTransformer : _ref5$requestTransfor,
      api = _ref5.api;

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

        var transform = action.options.overrideTransform ? action.options.overrideTransform : requestTransformer;

        return transform(dedupe(action.requestId, timeout(resolveRequest(api, action), configs.DEFAULT_TIMEOUT, {
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

export var defaultMiddleware = createMiddleware();

export var isStartedResolver = function isStartedResolver(response) {
  return !!response;
};
export var bodyResolver = function bodyResolver(response) {
  return response && response.jsonBody;
};
export var isLoadingResolver = function isLoadingResolver(isStarted, response) {
  return isStarted && response.isLoading === true;
};
export var isUpdatingResolver = function isUpdatingResolver(response) {
  return response && response.isUpdating === true;
};
export var isSuccessResolver = function isSuccessResolver(response) {
  return response && response.ok;
};
export var isErrorResolver = function isErrorResolver(isLoading, response) {
  return !isLoading && response && (response.ok === false || !!response.exception);
};
export var errorResolver = function errorResolver(response, isError) {
  return response && isError && (response.jsonBody || response.exception);
};
export var exceptionResolver = function exceptionResolver(response) {
  return response && response.exception;
};
export var isFinishedResolver = function isFinishedResolver(response) {
  return response && response.ok !== undefined;
};
export var requestAtResolver = function requestAtResolver(response) {
  return response && response.requestAt;
};
export var responseAtResolver = function responseAtResolver(response) {
  return response && response.responseAt;
};
export var requestDurationResolver = function requestDurationResolver(requestAt, responseAt) {
  return !!requestAt && !!responseAt ? responseAt - requestAt : null;
};
export var statusCodeResolver = function statusCodeResolver(response) {
  return response && response.status;
};

export var createResponseSelectors = function createResponseSelectors($response) {
  var $isStarted = createSelector($response, isStartedResolver);
  var $isLoading = createSelector($isStarted, $response, isLoadingResolver);
  var $isUpdating = createSelector($response, isUpdatingResolver);
  var $isSuccess = createSelector($response, isSuccessResolver);
  var $isError = createSelector($isLoading, $response, isErrorResolver);
  var $body = createSelector($response, bodyResolver);
  var $error = createSelector($response, $isError, errorResolver);
  var $exception = createSelector($response, exceptionResolver);
  var $isFinished = createSelector($response, isFinishedResolver);
  var $requestAt = createSelector($response, requestAtResolver);
  var $responseAt = createSelector($response, responseAtResolver);
  var $requestDuration = createSelector($requestAt, $responseAt, requestDurationResolver);
  var $statusCode = createSelector($response, statusCodeResolver);

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

export var createResponseSelectorsByKey = function createResponseSelectorsByKey(key) {
  var $response = createSelector($selectResponse, function (selectResponse) {
    return selectResponse[key];
  });

  var selectors = Object.assign({
    $response: $response
  }, createResponseSelectors($response));

  return selectors;
};

export var isDequestReceiveAction = function isDequestReceiveAction(object) {
  return (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.type && object.type === '@@DEQUEST/RECEIVE';
};

export default {
  reducer: defaultReducer,
  middleware: defaultMiddleware,
  createMiddleware: createMiddleware
};