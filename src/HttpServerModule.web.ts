import { registerWebModule, NativeModule } from 'expo';

import { HttpServerModuleEvents } from './HttpServer.types';

class HttpServerModule extends NativeModule<HttpServerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(HttpServerModule);
