import { HttpMethod } from 'expo-httpserver';
import { ScrollView, StyleSheet, View } from 'react-native';

import RequestTest from './components/RequestTest';
import ServerMonitor from './components/ServerMonitor';
import ServerContextProvider from './store/server-context';

export default function App() {
  return (
    <ServerContextProvider>
      <ScrollView>
        <View style={styles.root}>
          <ServerMonitor />
          <RequestTest method={HttpMethod.GET} path="/hello" />
          <RequestTest
            method={HttpMethod.GET}
            path="/request-headers"
            headers={{
              'Custom-Header-1': 'Custom-Value-1',
              'Custom-Header-2': 'Custom-Value-2',
            }}
          />
          <RequestTest method={HttpMethod.GET} path="/response-headers" />
          <RequestTest method={HttpMethod.GET} path="/error-500" />
          <RequestTest method={HttpMethod.GET} path="/error-400" />
          <RequestTest method={HttpMethod.GET} path="/throw" />
          <RequestTest method={HttpMethod.GET} path="/invalid-route" />
          <RequestTest method={HttpMethod.POST} path="/post-text" body="This is my text." />
          <RequestTest
            method={HttpMethod.PATCH}
            path="/patch-json"
            body={JSON.stringify({ 'This is': 'my object.' })}
          />
        </View>
      </ScrollView>
    </ServerContextProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
});
