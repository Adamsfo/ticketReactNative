import React, { useRef } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { WebView } from "react-native-webview";

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quill Editor</title>
  <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
  <style>
    body, html { height: 100%; margin: 0; padding: 0; }
    #editor { height: 90%; }
  </style>
</head>
<body>
  <div id="editor"></div>
  <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
  <script>
    var quill = new Quill('#editor', {
      theme: 'snow'
    });

    document.addEventListener('message', function(event) {
      const action = JSON.parse(event.data);
      if (action.type === 'SET_CONTENT') {
        quill.root.innerHTML = action.payload;
      }
    });

    quill.on('text-change', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONTENT_CHANGED',
        payload: quill.root.innerHTML
      }));
    });
  </script>
</body>
</html>
`;

interface TextEditorProps {
  onChange: (content: string) => void;
  initialContent: string;
}

export default function TextEditor({
  onChange,
  initialContent,
}: TextEditorProps) {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    const action = JSON.parse(event.nativeEvent.data);
    if (action.type === "CONTENT_CHANGED") {
      onChange(action.payload);
    }
  };

  const setContent = (content: string) => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(
        JSON.stringify({
          type: "SET_CONTENT",
          payload: content,
        })
      );
    }
  };

  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
