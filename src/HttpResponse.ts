import { HttpRequest } from './HttpRequest';
import { MIME_TYPES } from './HttpServer.consts';
import { HttpHeaders, HttpResponseData } from './HttpServer.types';
import { HttpStatus } from './HttpStatus';

export class HttpResponse {
  private _id: string;
  private _status: HttpStatus;
  private _payload: Uint8Array;
  private _headers: HttpHeaders;

  constructor(req: HttpRequest) {
    this._id = req.id;
    this._status = HttpStatus.INTERNAL_SERVER_ERROR;
    this._payload = new Uint8Array();
    this._headers = {};
  }

  public status(status: HttpStatus): HttpResponse {
    this._status = status;
    return this;
  }

  public data(data: Uint8Array): HttpResponse {
    this._payload = data;
    this.type('bin');
    return this;
  }

  public text(text: string): HttpResponse {
    this._payload = new TextEncoder().encode(text);
    this.type('txt');
    return this;
  }

  public json(object: any): HttpResponse {
    this._payload = new TextEncoder().encode(JSON.stringify(object));
    this.type('json');
    return this;
  }

  public set(field: string, value: string): HttpResponse {
    const lcField = field.toLowerCase();
    const exField = Object.keys(this._headers).find((x) => x.toLowerCase() === lcField) || field;
    this._headers[exField] = value;
    return this;
  }

  public get(field: string): string | undefined {
    const lcField = field.toLowerCase();
    const exField = Object.keys(this._headers).find((x) => x.toLowerCase() === lcField) || field;
    return this._headers[exField];
  }

  public type(type: string) {
    if (type.includes('/')) {
      return this.set('Content-Type', type);
    }
    if (type.startsWith('.')) type = type.substring(1);
    if (!MIME_TYPES[type]) throw new Error(`Unknown MIME type "${type}".`);
    return this.set('Content-Type', MIME_TYPES[type]);
  }

  public getNativePayload(): HttpResponseData {
    return {
      id: this._id,
      statusCode: this._status.code,
      statusDescription: this._status.description,
      data: this._payload,
      headers: this._headers,
    };
  }
}
