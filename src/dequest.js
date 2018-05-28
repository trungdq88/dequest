import { createSelector } from 'reselect';
import dedupe from 'promise-dedupe';
import timeout from '@trungdq88/promise-timeout';

const REDUCER_NAMESPACE = '@@dequest';
const DEFAULT_TIMEOUT = 10000; // 10 secs

class Dequest {
  constructor(requestId, request) {
    this.requestId = requestId;
    this.request = request;
  }
}

export class HandledRequest {
  constructor({ type, args } = {}) {
    this.type = type;
    this.args = args;
  }
}

export const get = (...args) => new HandledRequest({ type: 'get', args });
export const post = (...args) => new HandledRequest({ type: 'post', args });
export const put = (...args) => new HandledRequest({ type: 'put', args });
export const Delete = (...args) => new HandledRequest({ type: 'delete', args }); // damn, delete is reserved
export const patch = (...args) => new HandledRequest({ type: 'patch', args });

export const makeRequest = (requestId, request) => {
  return new Dequest(requestId, request);
};

export const invalidateRequest = requestId => ({
  type: '@@DEQUEST/INVALIDATE',
  requestId,
});

export const $selectResponse = createSelector(
  state => state,
  state => state[REDUCER_NAMESPACE],
);

export const defaultReducer = {
  [REDUCER_NAMESPACE]: (state = {}, action) => {
    switch (action.type) {
      case '@@DEQUEST/SEND':
        return {
          ...state,
          [action.requestId]: {
            isLoading: true,
            requestAt: action.requestAt,
            responseAt: null,
          },
        };
      case '@@DEQUEST/RECEIVE':
        return {
          ...state,
          [action.requestId]: {
            ...state[action.requestId],
            ...action.data,
            isLoading: false,
            isUpdating: false,
            responseAt: action.responseAt,
          },
        };
      case '@@DEQUEST/UPDATE':
        return {
          ...state,
          [action.requestId]: {
            ...state[action.requestId],
            isUpdating: true,
            exception: null,
            requestAt: action.requestAt,
            responseAt: null,
          },
        };
      case '@@DEQUEST/INVALIDATE':
        return {
          ...state,
          [action.requestId]: undefined,
        };
      default:
        return state;
    }
  },
};

const resolveRequest = async (api, action) => {
  if (action.request instanceof HandledRequest) {
    if (!api) throw new Error('Dequest: custom api is not defined');
    const type = action.request.type;
    const method = api[type];
    if (!method) {
      throw new Error(`Dequest: method ${type} not registered in custom api`);
    }
    return method(...action.request.args);
  }
  return action.request;
};

export const createMiddleware = (
  { requestTransformer = _ => Promise.resolve(_), api } = {},
) => store => next => action => {
  if (!(action instanceof Dequest)) {
    return next(action);
  }

  const requestAt = Date.now();
  const { $isFinished } = createResponseSelectorsByKey(action.requestId);
  if ($isFinished(store.getState())) {
    store.dispatch({
      type: '@@DEQUEST/UPDATE',
      requestId: action.requestId,
      requestAt,
    });
  } else {
    store.dispatch({
      type: '@@DEQUEST/SEND',
      requestId: action.requestId,
      requestAt,
    });
  }

  return requestTransformer(
    dedupe(
      action.requestId,
      timeout(resolveRequest(api, action), DEFAULT_TIMEOUT, {
        errorMessage: 'Connection timeout',
      }),
    ),
  )
    .then(r =>
      store.dispatch({
        type: '@@DEQUEST/RECEIVE',
        requestId: action.requestId,
        data: r,
        responseAt: Date.now(),
      }),
    )
    .catch(error => {
      console.error(error);
      throw new Error(
        'Error: promise rejected. ' +
          'Dequest requires request promise to always resolves!',
      );
    });
};

export const defaultMiddleware = createMiddleware();

export const createResponseSelectors = $response => {
  const $isStarted = createSelector($response, response => !!response);

  const $isLoading = createSelector(
    $isStarted,
    $response,
    (isStarted, response) => isStarted && response.isLoading === true,
  );

  const $isUpdating = createSelector(
    $response,
    response => response && response.isUpdating === true,
  );

  const $isSuccess = createSelector(
    $response,
    response => response && response.ok,
  );

  const $isError = createSelector(
    $isLoading,
    $response,
    (isLoading, response) =>
      !isLoading && response && (response.ok === false || !!response.exception),
  );

  const $body = createSelector(
    $response,
    response => response && response.jsonBody,
  );

  const $error = createSelector(
    $response,
    response => response && (response.jsonBody || response.exception),
  );

  const $exception = createSelector(
    $response,
    response => response && response.exception,
  );

  const $isFinished = createSelector(
    $response,
    response => response && response.ok !== undefined,
  );

  const $requestAt = createSelector(
    $response,
    response => response && response.requestAt,
  );

  const $responseAt = createSelector(
    $response,
    response => response && response.responseAt,
  );

  const $requestDuration = createSelector(
    $requestAt,
    $responseAt,
    (requestAt, responseAt) =>
      !!requestAt && !!responseAt ? responseAt - requestAt : null,
  );

  const $statusCode = createSelector(
    $response,
    response => response && response.status,
  );

  return {
    $isStarted,
    $isUpdating,
    $isFinished,
    $isLoading,
    $isSuccess,
    $body,
    $isError,
    $error,
    $exception,
    $requestAt,
    $responseAt,
    $requestDuration,
    $statusCode,
  };
};

export const createResponseSelectorsByKey = key => {
  const $response = createSelector(
    $selectResponse,
    selectResponse => selectResponse[key],
  );

  const selectors = {
    $response,
    ...createResponseSelectors($response),
  };

  return selectors;
};

export default {
  reducer: defaultReducer,
  middleware: defaultMiddleware,
  createMiddleware: createMiddleware,
};
