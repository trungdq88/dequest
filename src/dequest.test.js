import dequest, {
  makeRequest,
  invalidateRequest,
  $selectResponse,
  get,
  bodyResolver,
  isDequestReceiveAction,
} from './dequest.js';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';

global.Response = class Response {
  constructor(data) {
    Object.keys(data).forEach(key => (this[key] = data[key]));
  }
  json = () => Promise.resolve(this.jsonBody);

  serialize = () => {
    const { jsonBody, ok, status, statusText } = this;
    return { jsonBody, ok, status, statusText };
  };
};

describe('dequest', () => {
  let store;
  const createMockResponse = jsonBody =>
    new Response({
      status: 200,
      statusText: 'OK',
      ok: true,
      jsonBody,
    });

  const mockResponse = createMockResponse({ something: 'here' });

  const createStoreWithMidleware = middlewareParams =>
    (store = createStore(
      combineReducers({
        ...dequest.reducer,
      }),
      compose(applyMiddleware(dequest.createMiddleware(middlewareParams))),
    ));

  beforeEach(() => {
    store = createStore(
      combineReducers({
        ...dequest.reducer,
      }),
      compose(applyMiddleware(dequest.createMiddleware())),
    );
  });

  describe('makeRequest', () => {
    it('should be defined', () => {
      expect(makeRequest).toBeTruthy();
    });

    it('should change state when dispatch makeRequest', async () => {
      const request = store.dispatch(
        makeRequest('123', Promise.resolve(mockResponse)),
      );
      expect(store.getState()).toEqual({
        '@@dequest': { '123': expect.objectContaining({ isLoading: true }) },
      });
      await request;
      expect(store.getState()).toEqual({
        '@@dequest': {
          '123': expect.objectContaining({
            isUpdating: false,
            isLoading: false,
            ...mockResponse.serialize(),
          }),
        },
      });
    });
  });

  describe('invalidateRequest', () => {
    it('should be defined', () => {
      expect(invalidateRequest).toBeTruthy();
    });
    it('should delete state when dispatch invalidateRequest', async () => {
      const request = store.dispatch(
        makeRequest('123', Promise.resolve(mockResponse)),
      );
      expect(store.getState()).toEqual({
        '@@dequest': { '123': expect.objectContaining({ isLoading: true }) },
      });
      await request;
      expect(store.getState()).toEqual({
        '@@dequest': {
          '123': expect.objectContaining({
            isUpdating: false,
            isLoading: false,
            ...mockResponse.serialize(),
          }),
        },
      });
      store.dispatch(invalidateRequest('123'));
      expect(store.getState()).toEqual({
        '@@dequest': {
          '123': undefined,
        },
      });
    });
  });

  describe('$selectResponse', () => {
    it('should works without requests', () => {
      expect($selectResponse).toBeInstanceOf(Function);
      expect($selectResponse(store.getState())).toEqual({});
    });

    it('should works with requests', async () => {
      await store.dispatch(makeRequest('123', Promise.resolve(mockResponse)));
      expect($selectResponse(store.getState())).toEqual({
        '123': expect.objectContaining({
          isUpdating: false,
          isLoading: false,
          ...mockResponse.serialize(),
        }),
      });
    });
  });

  describe('custom api', () => {
    it('should give get params to api', () => {
      const mockGet = jest.fn().mockImplementation(() => mockResponse);
      const store = createStoreWithMidleware({ api: { get: mockGet } });
      const fakeRequest = Math.random();
      const fakeParams = Math.random();
      store.dispatch(makeRequest('test', get(fakeRequest, fakeParams)));
      expect(mockGet.mock.calls[0][0].request.args).toEqual([
        fakeRequest,
        fakeParams,
      ]);
    });

    it('should allows multiple api entries', async () => {
      const createMockGet = res =>
        jest.fn().mockImplementation(() => createMockResponse(res));
      const mockGet1 = createMockGet({ a: 1 });
      const mockGet2 = createMockGet({ b: 2 });
      const store = createStoreWithMidleware({
        apis: {
          entry1: { get: mockGet1 },
          entry2: { get: mockGet2 },
        },
      });

      const requestToApi1 = store.dispatch(
        makeRequest('test1', get('http://111111', '11'), {
          apiEntry: 'entry1',
        }),
      );
      const requestToApi2 = store.dispatch(
        makeRequest('test2', get('http://222222222', '22'), {
          apiEntry: 'entry2',
        }),
      );
      expect(mockGet1.mock.calls.length).toBe(1);
      expect(mockGet1.mock.calls[0][0].request.args).toEqual([
        'http://111111',
        '11',
      ]);
      expect(mockGet2.mock.calls.length).toEqual(1);
      expect(mockGet2.mock.calls[0][0].request.args).toEqual([
        'http://222222222',
        '22',
      ]);
    });
  });

  describe('race condition', () => {
    it('should works', async () => {
      const store = createStoreWithMidleware({
        api: {
          get: action =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve(
                    new Response({
                      status: 200,
                      statusText: 'OK',
                      ok: true,
                      jsonBody: { data: action.request.args[0] },
                    }),
                  ),
                action.request.args[0], // time,
              ),
            ),
        },
      });
      const request1 = store.dispatch(makeRequest('testId', get(300)));
      const request2 = store.dispatch(makeRequest('testId', get(10)));
      await new Promise(r => setTimeout(r, 500));
      expect($selectResponse(store.getState())).toEqual({
        testId: expect.objectContaining({
          isUpdating: false,
          isLoading: false,
          status: 200,
          statusText: 'OK',
          ok: true,
          jsonBody: { data: 10 },
        }),
      });
    });
  });

  describe('resolvers', () => {
    it('bodyResolver', () => {
      expect(
        bodyResolver({
          isUpdating: false,
          isLoading: false,
          status: 200,
          statusText: 'OK',
          ok: true,
          jsonBody: { data: 10 },
        }),
      ).toEqual({ data: 10 });
    });
  });

  describe('utils', () => {
    it('isDequestReceiveAction', () => {
      expect(
        isDequestReceiveAction({
          type: '@@DEQUEST/RECEIVE',
        }),
      ).toBe(true);
    });
  });

  describe('requestTransformer', () => {
    it('should transform if requestTransformer', async () => {
      const transformedResponse = new Response({
        status: 200,
        statusText: 'OK',
        ok: true,
        jsonBody: { transformed: Math.random() },
      });
      store = createStore(
        combineReducers({
          ...dequest.reducer,
        }),
        compose(
          applyMiddleware(
            dequest.createMiddleware({
              requestTransformer: _ => Promise.resolve(transformedResponse),
            }),
          ),
        ),
      );
      const request = store.dispatch(
        makeRequest('123', Promise.resolve(mockResponse)),
      );
      expect(store.getState()).toEqual({
        '@@dequest': { '123': expect.objectContaining({ isLoading: true }) },
      });
      await request;
      expect(store.getState()).toEqual({
        '@@dequest': {
          '123': expect.objectContaining({
            isUpdating: false,
            isLoading: false,
            ...transformedResponse.serialize(),
          }),
        },
      });
    });

    it('overrideTransform', async () => {
      const transformedResponse = new Response({
        status: 200,
        statusText: 'OK',
        ok: true,
        jsonBody: { transformed: Math.random() },
      });
      store = createStore(
        combineReducers({
          ...dequest.reducer,
        }),
        compose(applyMiddleware(dequest.createMiddleware())),
      );
      const request = store.dispatch(
        makeRequest('123', Promise.resolve(mockResponse), {
          overrideTransform: _ => Promise.resolve(transformedResponse),
        }),
      );
      expect(store.getState()).toEqual({
        '@@dequest': { '123': expect.objectContaining({ isLoading: true }) },
      });
      await request;
      expect(store.getState()).toEqual({
        '@@dequest': {
          '123': expect.objectContaining({
            isUpdating: false,
            isLoading: false,
            ...transformedResponse.serialize(),
          }),
        },
      });
    });
  });
});
