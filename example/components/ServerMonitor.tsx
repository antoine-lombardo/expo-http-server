import { HttpRequest, HttpResponse, HttpStatus, OnRunningChangeEvent } from 'expo-httpserver';
import React, { useContext, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { PORT } from '../common/constants';
import { ServerContext } from '../store/server-context';

const ServerMonitor = () => {
  const serverCtx = useContext(ServerContext);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningSubscription, setIsRunningSubscription] = useState<any>(null);

  const _updateIsRunning = (event: OnRunningChangeEvent) => {
    console.log(event);
    setIsRunning(event.isRunning);
  };

  const _subscribe = () => {
    setIsRunningSubscription(serverCtx.addIsRunningListener(_updateIsRunning));
    setIsRunning(serverCtx.isRunning);
  };

  const _unsubscribe = () => {
    isRunningSubscription && isRunningSubscription.remove();
    setIsRunningSubscription(null);
  };

  const _startServer = () => {
    serverCtx.clearRoutes();
    serverCtx.get('/hello', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.OK).json({ hello: 'world' });
    });
    serverCtx.get('/request-headers', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.OK).json({ requestHeaders: req.headers });
    });
    serverCtx.get('/response-headers', (req: HttpRequest, res: HttpResponse) => {
      res.set('Custom-Header-1', 'Custom-Value-1');
      res.set('Custom-Header-2', 'Custom-Value-2');
      res.status(HttpStatus.OK).json({});
    });
    serverCtx.get('/error-500', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 500 });
    });
    serverCtx.get('/error-400', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 400 });
    });
    serverCtx.get('/throw', (req: HttpRequest, res: HttpResponse) => {
      throw new Error('Unexpected error.');
    });
    serverCtx.post('/post-text', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.OK).json({ body: req.string() });
    });
    serverCtx.post('/patch-json', (req: HttpRequest, res: HttpResponse) => {
      res.status(HttpStatus.OK).json({ body: req.json() });
    });
    serverCtx.listen(PORT);
  };

  const _stopServer = () => {
    serverCtx.stop();
  };

  useEffect(() => {
    _subscribe();
    return () => {
      _unsubscribe();
    };
  }, [serverCtx]);

  return (
    <View>
      <Text>Is running: {isRunning ? 'Yes' : 'No'}</Text>
      <View style={styles.buttons}>
        <Button title="Start" onPress={_startServer} />
        <Button title="Stop" onPress={_stopServer} />
      </View>
    </View>
  );
};

export default ServerMonitor;

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
  },
});
