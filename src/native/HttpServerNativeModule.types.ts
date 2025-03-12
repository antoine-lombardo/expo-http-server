// ---------------------------------- //
//               Events               //
// ---------------------------------- //

export type HttpServerNativeModuleEvents = {
  onRequest(event: OnRequestEvent): void;
  onLog(event: OnLogEvent): void;
  onRunningChange(event: OnRunningChangeEvent): void;
};

export type OnRequestEvent = {
  id: string;
  method: HttpMethod;
  uri: string;
  body: Uint8Array;
  headers: HttpHeaders;
};

export type OnLogEvent = {
  message: string;
};

export type OnRunningChangeEvent = {
  isRunning: boolean;
};

// ---------------------------------- //
//               Enums                //
// ---------------------------------- //

export enum ErrorCode {
  SUCCESS,
  ALREADY_RUNNING,
  PORT_USED,
  UNKNOWN,
}

export enum HttpMethod {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  UNKNOWN,
}

// ---------------------------------- //
//            Type Helpers            //
// ---------------------------------- //

export type HttpHeaders = { [field: string]: string };
