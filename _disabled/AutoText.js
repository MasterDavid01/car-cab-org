import React from 'react';
import { Text } from 'react-native';

export default function AutoText({ children }) {
  if (typeof children === 'string') {
    return <Text>{children}</Text>;
  }
  return <>{children}</>;
}
