import { NativeModule, requireNativeModule } from 'expo';

import {
  ErrorCode,
  HttpHeaders,
  HttpServerNativeModuleEvents,
  OnLogEvent,
  OnRequestEvent,
} from './HttpServerNativeModule.types';
import { HttpRequest } from '../HttpRequest';
import { HttpServer } from '../HttpServer';

declare class HttpServerNativeModule extends NativeModule<HttpServerNativeModuleEvents> {
  isRunning: boolean;

  getTheme(): string;
  start(port: number, force: boolean): ErrorCode;
  stop(): ErrorCode;
  respond(
    id: string,
    statusCode: number,
    statusDescription: string,
    data: Uint8Array,
    headers: HttpHeaders,
  ): ErrorCode;
}

const HttpServerNative = requireNativeModule<HttpServerNativeModule>('HttpServer');

HttpServerNative.addListener('onRequest', (event: OnRequestEvent) => {
  try {
    const server = HttpServer.getInstance(false);
    server.handleRequest(new HttpRequest(event));
  } catch {}
});

HttpServerNative.addListener('onLog', (event: OnLogEvent) => {
  console.log('Message from native module:', event.message);
});

export default HttpServerNative;
