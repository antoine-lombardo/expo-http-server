// Reexport the native module. On web, it will be resolved to HttpServerModule.web.ts
// and on native platforms to HttpServerModule.ts
export { default } from './HttpServerModule';
export { default as HttpServerView } from './HttpServerView';
export * from './HttpServer.types';
