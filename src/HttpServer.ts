import { HttpRequest } from './HttpRequest';
import { HttpResponse } from './HttpResponse';
import { HttpCallback, HttpMethod, HttpRoute } from './HttpServer.types';
import { HttpStatus } from './HttpStatus';
import HttpServerNative from './native/HttpServerNativeModule';
import { ErrorCode, OnRunningChangeEvent } from './native/HttpServerNativeModule.types';

export class HttpServer {
  private static _instance: HttpServer | undefined = undefined;
  private _routes: HttpRoute[] = [];

  get isRunning(): boolean {
    return HttpServerNative.isRunning;
  }

  constructor() {
    if (HttpServer._instance) {
      throw new Error(
        'Only one instance of HttpServer is allowed. Use HttpServer.getInstance() to retrieve the existing instance.',
      );
    }
  }

  public static getInstance(createInstance: boolean = true): HttpServer {
    if (!HttpServer._instance) {
      if (createInstance) HttpServer._instance = new HttpServer();
      else throw Error('No HttpServer instance.');
    }
    return HttpServer._instance;
  }

  public addIsRunningListener(listener: (event: OnRunningChangeEvent) => void) {
    return HttpServerNative.addListener('onRunningChange', listener);
  }

  public removeIsRunningListener(listener: (event: OnRunningChangeEvent) => void) {
    HttpServerNative.removeListener('onRunningChange', listener);
  }

  public clearIsRunningListeners() {
    HttpServerNative.removeAllListeners('onRunningChange');
  }

  private _addRoute(route: HttpRoute) {
    this._routes.push(route);
  }

  public clearRoutes() {
    this._routes = [];
  }

  public get(pathPattern: string, callback: HttpCallback) {
    this._addRoute({ method: HttpMethod.GET, pathPattern, callback });
  }

  public post(pathPattern: string, callback: HttpCallback) {
    this._addRoute({ method: HttpMethod.POST, pathPattern, callback });
  }

  public put(pathPattern: string, callback: HttpCallback) {
    this._addRoute({ method: HttpMethod.PUT, pathPattern, callback });
  }

  public patch(pathPattern: string, callback: HttpCallback) {
    this._addRoute({ method: HttpMethod.PATCH, pathPattern, callback });
  }

  public delete(pathPattern: string, callback: HttpCallback) {
    this._addRoute({ method: HttpMethod.DELETE, pathPattern, callback });
  }

  public listen(port: number): boolean {
    return HttpServerNative.start(port, true) === ErrorCode.SUCCESS;
  }

  public stop(): boolean {
    return HttpServerNative.stop() === ErrorCode.SUCCESS;
  }

  public handleRequest(req: HttpRequest) {
    let res: HttpResponse | undefined = undefined;
    for (const route of this._routes) {
      const re = RegExp(`^${route.pathPattern}$`);
      if (req.uri.path?.match(re)) {
        try {
          res = new HttpResponse(req);
          route.callback(req, res);
        } catch {
          res = new HttpResponse(req)
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .text('Internal Server Error.');
        }
        break;
      }
    }
    // Route not found
    if (!res) {
      res = new HttpResponse(req).status(HttpStatus.NOT_FOUND).text('Not Found');
    }
    const payload = res.getNativePayload();
    HttpServerNative.respond(
      payload.id,
      payload.statusCode,
      payload.statusDescription,
      payload.data,
      payload.headers,
    );
  }
}
