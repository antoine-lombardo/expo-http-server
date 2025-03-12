import { parse, URIComponents } from 'uri-js';

import { HttpMethod, HttpHeaders } from './HttpServer.types';
import { OnRequestEvent } from './native/HttpServerNativeModule.types';

export class HttpRequest {
  public id: string;
  public method: HttpMethod;
  public uri: URIComponents;
  public body: Uint8Array;
  private _headers: { [name: string]: string };

  constructor(event: OnRequestEvent) {
    this.id = event.id;
    this.method = event.method;
    this.uri = parse(event.uri);
    this.body = event.body;
    this._headers = event.headers;
  }

  get headers(): HttpHeaders {
    return { ...this._headers };
  }

  public string(label: string = 'utf-8'): string {
    return new TextDecoder(label).decode(this.body);
  }

  public json<T>(): T {
    return JSON.parse(this.string()) as T;
  }

  public get(field: string): string | undefined {
    return this._headers[field.toLowerCase()];
  }
}

export type HttpResponseNativePayload = {
  id: string;
  statusCode: number;
  statusDescription: string;
  data: Uint8Array;
  headers: HttpHeaders;
};
