import axios, { AxiosError, AxiosResponse } from 'axios';
import { HttpHeaders, HttpMethod } from 'expo-httpserver';
import React, { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { PORT } from '../common/constants';

type Props = {
  path: string;
  method: HttpMethod;
  body?: string;
  headers?: HttpHeaders;
};

const RequestTest = (props: Props) => {
  const [response, setResponse] = useState<AxiosResponse | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  let methodName = 'N/A';
  let methodAxios = 'get';
  let methodColor = '#585858';
  switch (props.method) {
    case HttpMethod.GET:
      methodName = 'GET';
      methodAxios = 'get';
      methodColor = '#0d6ab4';
      break;
    case HttpMethod.POST:
      methodName = 'POST';
      methodAxios = 'post';
      methodColor = '#19a249';
      break;
    case HttpMethod.PUT:
      methodName = 'PUT';
      methodAxios = 'put';
      methodColor = '#c6862a';
      break;
    case HttpMethod.PATCH:
      methodName = 'PATCH';
      methodAxios = 'patch';
      methodColor = '#d28141';
      break;
    case HttpMethod.DELETE:
      methodName = 'DELETE';
      methodAxios = 'delete';
      methodColor = '#a41e23';
      break;
    default:
      methodName = 'N/A';
      methodAxios = 'get';
      methodColor = '#585858';
  }

  const renderBody = (body: string | undefined) => {
    let content = <Text>"N/A"</Text>;

    if (body) {
      content = <Text>{body}</Text>;
    }

    return (
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Body</Text>
        <View style={styles.subSectionContent}>{content}</View>
      </View>
    );
  };

  const renderHeaders = (headers: HttpHeaders | undefined) => {
    let content = <Text>"N/A"</Text>;

    if (headers !== undefined) {
      const headersList: { key: string; value: string }[] = [];
      for (const [key, value] of Object.entries(headers)) {
        headersList.push({ key, value });
      }

      if (headersList.length > 0) {
        content = (
          <FlatList
            data={headersList}
            renderItem={(itemData) => (
              <View style={styles.httpHeaderContainer}>
                <Text style={styles.httpHeaderKeyText}>{itemData.item.key}</Text>
                <Text style={styles.httpHeaderValueText}>{itemData.item.value}</Text>
              </View>
            )}
          />
        );
      }
    }

    return (
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Headers</Text>
        <View style={styles.subSectionContent}>{content}</View>
      </View>
    );
  };

  const renderResponseHeaders = () => {
    if (response === undefined) return renderHeaders({});
    return renderHeaders(response.headers as HttpHeaders);
  };

  const renderRequestHeaders = () => {
    if (response === undefined || !response.request) return renderHeaders(props.headers);
    return renderHeaders(response?.request._headers);
  };

  const makeRequestHandler = async () => {
    try {
      const url = `http://localhost:${PORT}${props.path}`;
      const response = await axios.request({
        method: methodAxios,
        url,
        data: props.body,
        headers: props.headers,
        responseType: 'text',
      });
      setError(undefined);
      setResponse(response);
    } catch (e) {
      if (e instanceof AxiosError) {
        setError(undefined);
        setResponse(e.response);
      } else {
        setResponse(undefined);
        setError(String(e));
      }
    }
  };

  return (
    <View style={styles.rootContainer}>
      <View style={styles.methodPathContainer}>
        <View style={[styles.methodContainer, { backgroundColor: methodColor }]}>
          <Text style={styles.methodText}>{methodName}</Text>
        </View>
        <Text style={styles.pathText}>{props.path}</Text>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Request</Text>

        {renderRequestHeaders()}

        {renderBody(props.body)}
      </View>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Response</Text>

        {error !== undefined && (
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Error</Text>
            <View style={styles.subSectionContent}>
              <Text>{error}</Text>
            </View>
          </View>
        )}

        {error === undefined && (
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Status Code</Text>
            <View style={styles.subSectionContent}>
              <Text>{response ? response.status : 'N/A'}</Text>
            </View>
          </View>
        )}

        {error === undefined && renderResponseHeaders()}

        {error === undefined && renderBody(response?.data)}
      </View>

      <View style={styles.button}>
        <Button title="Make Request" onPress={makeRequestHandler} />
      </View>
    </View>
  );
};

export default RequestTest;

const styles = StyleSheet.create({
  rootContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFF09EFF',
    padding: 20,
    marginBottom: 20,
  },
  methodPathContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContainer: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodText: {
    color: 'white',
    fontWeight: '700',
  },
  pathText: {},
  sectionContainer: {
    backgroundColor: '#FFFFFF8A',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 20,
  },
  subSection: {},
  subSectionTitle: {
    fontWeight: 500,
    fontSize: 16,
    marginTop: 8,
  },
  subSectionContent: {
    paddingLeft: 10,
  },
  httpHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  httpHeaderKeyText: {
    fontWeight: 500,
  },
  httpHeaderValueText: {
    fontWeight: 500,
  },
  button: {
    marginTop: 20,
  },
});
