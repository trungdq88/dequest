import _regeneratorRuntime from 'babel-runtime/regenerator';

var _this2 = this;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import dequest, { makeRequest, invalidateRequest, $selectResponse, get, bodyResolver, isDequestReceiveAction } from './dequest.js';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';

global.Response = function Response(data) {
  var _this = this;

  _classCallCheck(this, Response);

  this.json = function () {
    return Promise.resolve(_this.jsonBody);
  };

  this.serialize = function () {
    var jsonBody = _this.jsonBody,
        ok = _this.ok,
        status = _this.status,
        statusText = _this.statusText;

    return { jsonBody: jsonBody, ok: ok, status: status, statusText: statusText };
  };

  Object.keys(data).forEach(function (key) {
    return _this[key] = data[key];
  });
};

describe('dequest', function () {
  var store = void 0;
  var mockResponse = new Response({
    status: 200,
    statusText: 'OK',
    ok: true,
    jsonBody: { something: 'here' }
  });

  var createStoreWithMockApi = function createStoreWithMockApi(api) {
    return store = createStore(combineReducers(Object.assign({}, dequest.reducer)), compose(applyMiddleware(dequest.createMiddleware({
      api: api
    }))));
  };

  beforeEach(function () {
    store = createStore(combineReducers(Object.assign({}, dequest.reducer)), compose(applyMiddleware(dequest.createMiddleware())));
  });

  describe('makeRequest', function () {
    it('should be defined', function () {
      expect(makeRequest).toBeTruthy();
    });

    it('should change state when dispatch makeRequest', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var request;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              request = store.dispatch(makeRequest('123', Promise.resolve(mockResponse)));

              expect(store.getState()).toEqual({
                '@@dequest': { '123': expect.objectContaining({ isLoading: true }) }
              });
              _context.next = 4;
              return request;

            case 4:
              expect(store.getState()).toEqual({
                '@@dequest': {
                  '123': expect.objectContaining(Object.assign({
                    isUpdating: false,
                    isLoading: false
                  }, mockResponse.serialize()))
                }
              });

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this2);
    })));
  });

  describe('invalidateRequest', function () {
    it('should be defined', function () {
      expect(invalidateRequest).toBeTruthy();
    });
    it('should delete state when dispatch invalidateRequest', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var request;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              request = store.dispatch(makeRequest('123', Promise.resolve(mockResponse)));

              expect(store.getState()).toEqual({
                '@@dequest': { '123': expect.objectContaining({ isLoading: true }) }
              });
              _context2.next = 4;
              return request;

            case 4:
              expect(store.getState()).toEqual({
                '@@dequest': {
                  '123': expect.objectContaining(Object.assign({
                    isUpdating: false,
                    isLoading: false
                  }, mockResponse.serialize()))
                }
              });
              store.dispatch(invalidateRequest('123'));
              expect(store.getState()).toEqual({
                '@@dequest': {
                  '123': undefined
                }
              });

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    })));
  });

  describe('$selectResponse', function () {
    it('should works without requests', function () {
      expect($selectResponse).toBeInstanceOf(Function);
      expect($selectResponse(store.getState())).toEqual({});
    });

    it('should works with requests', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return store.dispatch(makeRequest('123', Promise.resolve(mockResponse)));

            case 2:
              expect($selectResponse(store.getState())).toEqual({
                '123': expect.objectContaining(Object.assign({
                  isUpdating: false,
                  isLoading: false
                }, mockResponse.serialize()))
              });

            case 3:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this2);
    })));
  });

  describe('custom api', function () {
    it('should give get params to api', function () {
      var mockGet = jest.fn().mockImplementation(function () {
        return mockResponse;
      });
      var store = createStoreWithMockApi({ get: mockGet });
      var fakeRequest = Math.random();
      var fakeParams = Math.random();
      store.dispatch(makeRequest('test', get(fakeRequest, fakeParams)));
      expect(mockGet).toHaveBeenCalledWith(fakeRequest, fakeParams);
    });
  });

  describe('race condition', function () {
    it('should works', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
      var store, request1, request2;
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              store = createStoreWithMockApi({
                get: function get(time) {
                  return new Promise(function (resolve) {
                    return setTimeout(function () {
                      return resolve(new Response({
                        status: 200,
                        statusText: 'OK',
                        ok: true,
                        jsonBody: { data: time }
                      }));
                    }, time);
                  });
                }
              });
              request1 = store.dispatch(makeRequest('testId', get(300)));
              request2 = store.dispatch(makeRequest('testId', get(10)));
              _context4.next = 5;
              return new Promise(function (r) {
                return setTimeout(r, 500);
              });

            case 5:
              expect($selectResponse(store.getState())).toEqual({
                testId: expect.objectContaining({
                  isUpdating: false,
                  isLoading: false,
                  status: 200,
                  statusText: 'OK',
                  ok: true,
                  jsonBody: { data: 10 }
                })
              });

            case 6:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this2);
    })));
  });

  describe('resolvers', function () {
    it('bodyResolver', function () {
      expect(bodyResolver({
        isUpdating: false,
        isLoading: false,
        status: 200,
        statusText: 'OK',
        ok: true,
        jsonBody: { data: 10 }
      })).toEqual({ data: 10 });
    });
  });

  describe('utils', function () {
    it('isDequestReceiveAction', function () {
      expect(isDequestReceiveAction({
        type: '@@DEQUEST/RECEIVE'
      })).toBe(true);
    });
  });

  describe('requestTransformer', function () {
    it('should transform if requestTransformer', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
      var transformedResponse, request;
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              transformedResponse = new Response({
                status: 200,
                statusText: 'OK',
                ok: true,
                jsonBody: { transformed: Math.random() }
              });

              store = createStore(combineReducers(Object.assign({}, dequest.reducer)), compose(applyMiddleware(dequest.createMiddleware({
                requestTransformer: function requestTransformer(_) {
                  return Promise.resolve(transformedResponse);
                }
              }))));
              request = store.dispatch(makeRequest('123', Promise.resolve(mockResponse)));

              expect(store.getState()).toEqual({
                '@@dequest': { '123': expect.objectContaining({ isLoading: true }) }
              });
              _context5.next = 6;
              return request;

            case 6:
              expect(store.getState()).toEqual({
                '@@dequest': {
                  '123': expect.objectContaining(Object.assign({
                    isUpdating: false,
                    isLoading: false
                  }, transformedResponse.serialize()))
                }
              });

            case 7:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this2);
    })));

    it('skipTransform', _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
      var transformedResponse, request;
      return _regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              transformedResponse = new Response({
                status: 200,
                statusText: 'OK',
                ok: true,
                jsonBody: { transformed: Math.random() }
              });

              store = createStore(combineReducers(Object.assign({}, dequest.reducer)), compose(applyMiddleware(dequest.createMiddleware({
                requestTransformer: function requestTransformer(_) {
                  return Promise.resolve(transformedResponse);
                }
              }))));
              request = store.dispatch(makeRequest('123', Promise.resolve(mockResponse), {
                skipTransform: true
              }));

              expect(store.getState()).toEqual({
                '@@dequest': { '123': expect.objectContaining({ isLoading: true }) }
              });
              _context6.next = 6;
              return request;

            case 6:
              expect(store.getState()).toEqual({
                '@@dequest': {
                  '123': expect.objectContaining(Object.assign({
                    isUpdating: false,
                    isLoading: false
                  }, mockResponse.serialize()))
                }
              });

            case 7:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this2);
    })));
  });
});