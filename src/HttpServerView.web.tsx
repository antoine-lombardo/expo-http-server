import * as React from 'react';

import { HttpServerViewProps } from './HttpServer.types';

export default function HttpServerView(props: HttpServerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
