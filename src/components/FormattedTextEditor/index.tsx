import React, { useRef } from "react";
import {
  StyleSheet,
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Text,
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

// interface TextEditorProps {
//   onChange: (html: string) => void;
//   initialContent: string;
// }

export default function FormattedTextEditor() {
  const richText = useRef<RichEditor>(null);

  // const handleEditorChange = (html: string) => {
  //   console.log("Editor content changed:", html);
  //   onChange(html);
  // };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <RichEditor
            ref={richText}
            // initialContentHTML={initialContent}
            // onChange={handleEditorChange}
            style={styles.richEditor}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.heading1,
        ]}
        iconMap={{
          [actions.heading1]: ({ tintColor }: { tintColor: string }) => (
            <Text style={{ color: tintColor }}>H1</Text>
          ),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  richEditor: {
    flex: 1,
    minHeight: 200,
  },
});
