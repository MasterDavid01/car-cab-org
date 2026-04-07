import { Text, TextProps } from "react-native";

export function ThemedText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          color: "#000",
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}
