import React, { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";

const QuillEditorWeb = () => {
  const [value, setValue] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <p>Carregando...</p>;

  const ReactQuill = require("react-quill"); // Importa apenas no cliente

  return (
    <div>
      <ReactQuill value={value} onChange={setValue} />
    </div>
  );
};

export default QuillEditorWeb;
