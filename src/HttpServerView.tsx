import { requireNativeView } from 'expo';
import * as React from 'react';

import { HttpServerViewProps } from './HttpServer.types';

const NativeView: React.ComponentType<HttpServerViewProps> = requireNativeView('HttpServer');

export default function HttpServerView(props: HttpServerViewProps) {
  return <NativeView {...props} />;
}
