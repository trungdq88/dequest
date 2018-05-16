import dequest, {
  makeRequest,
  invalidateRequest,
  $selectResponse,
  get,
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
  const mockResponse = new Response({
    status: 200,
    statusText: 'OK',
    ok: true,
    jsonBody: { something: 'here' },
  });

  const createStoreWithMockApi = api =>
    (store = createStore(
      combineReducers({
        ...dequest.reducer,
      }),
      compose(
        applyMiddleware(
          dequest.createMiddleware({
            api,
          }),
        ),
      ),
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
      const store = createStoreWithMockApi({ get: mockGet });
      const fakeRequest = Math.random();
      const fakeParams = Math.random();
      store.dispatch(makeRequest('test', get(fakeRequest, fakeParams)));
      expect(mockGet).toHaveBeenCalledWith(fakeRequest, fakeParams);
    });
  });

  describe('race condition', () => {
    it('should works', async () => {
      const store = createStoreWithMockApi({
        get: time =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve(
                  new Response({
                    status: 200,
                    statusText: 'OK',
                    ok: true,
                    jsonBody: { data: time },
                  }),
                ),
              time,
            ),
          ),
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
});
