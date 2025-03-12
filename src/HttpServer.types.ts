import { HttpRequest } from './HttpRequest';
import { HttpResponse } from './HttpResponse';
import { HttpHeaders, HttpMethod } from './native/HttpServerNativeModule.types';
export { OnRunningChangeEvent } from './native/HttpServerNativeModule.types';

export type HttpCallback = (req: HttpRequest, res: HttpResponse) => void;

export type HttpRoute = {
  method: HttpMethod;
  pathPattern: string;
  callback: (req: HttpRequest, res: HttpResponse) => void;
};

export type HttpResponseData = {
  id: string;
  statusCode: number;
  statusDescription: string;
  data: Uint8Array;
  headers: HttpHeaders;
};

export { HttpHeaders, HttpMethod } from './native/HttpServerNativeModule.types';
