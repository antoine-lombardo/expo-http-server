import { NativeModule, requireNativeModule } from 'expo';

import { HttpServerModuleEvents } from './HttpServer.types';

declare class HttpServerModule extends NativeModule<HttpServerModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<HttpServerModule>('HttpServer');
