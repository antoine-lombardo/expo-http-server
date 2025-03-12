import { HttpServer } from 'expo-http-server';
import { createContext, ReactNode, useState } from 'react';

export const ServerContext = createContext<HttpServer>(HttpServer.getInstance());

type Props = {
  children: ReactNode;
};

const ServerContextProvider = (props: Props) => {
  const [server] = useState<HttpServer>(HttpServer.getInstance());

  return <ServerContext.Provider value={server}>{props.children}</ServerContext.Provider>;
};

export default ServerContextProvider;
