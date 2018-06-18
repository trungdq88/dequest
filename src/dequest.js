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

export const isStartedResolver = response => !!response;
export const bodyResolver = response => response && response.jsonBody;
export const isLoadingResolver = (isStarted, response) =>
  isStarted && response.isLoading === true;
export const isUpdatingResolver = response =>
  response && response.isUpdating === true;
export const isSuccessResolver = response => response && response.ok;
export const isErrorResolver = (isLoading, response) =>
  !isLoading && response && (response.ok === false || !!response.exception);
export const errorResolver = response =>
  response && (response.jsonBody || response.exception);
export const exceptionResolver = response => response && response.exception;
export const isFinishedResolver = response =>
  response && response.ok !== undefined;
export const requestAtResolver = response => response && response.requestAt;
export const responseAtResolver = response => response && response.responseAt;
export const requestDurationResolver = (requestAt, responseAt) =>
  !!requestAt && !!responseAt ? responseAt - requestAt : null;
export const statusCodeResolver = response => response && response.status;

export const createResponseSelectors = $response => {
  const $isStarted = createSelector($response, isStartedResolver);
  const $isLoading = createSelector($isStarted, $response, isLoadingResolver);
  const $isUpdating = createSelector($response, isUpdatingResolver);
  const $isSuccess = createSelector($response, isSuccessResolver);
  const $isError = createSelector($isLoading, $response, isErrorResolver);
  const $body = createSelector($response, bodyResolver);
  const $error = createSelector($response, errorResolver);
  const $exception = createSelector($response, exceptionResolver);
  const $isFinished = createSelector($response, isFinishedResolver);
  const $requestAt = createSelector($response, requestAtResolver);
  const $responseAt = createSelector($response, responseAtResolver);
  const $requestDuration = createSelector(
    $requestAt,
    $responseAt,
    requestDurationResolver,
  );
  const $statusCode = createSelector($response, statusCodeResolver);

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

export const isDequestReceiveAction = object =>
  typeof object === 'object' &&
  object.type &&
  object.type === '@@DEQUEST/RECEIVE';

export default {
  reducer: defaultReducer,
  middleware: defaultMiddleware,
  createMiddleware: createMiddleware,
};
