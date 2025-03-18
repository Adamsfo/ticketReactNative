import React, { useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";

interface QuillEditorWebProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditorWeb: React.FC<QuillEditorWebProps> = ({ value, onChange }) => {
  const [isClient, setIsClient] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <p>Carregando...</p>;

  const ReactQuill = require("react-quill"); // Importa apenas no cliente

  return <ReactQuill ref={quillRef} value={value} onChange={onChange} />;
};

export default QuillEditorWeb;
