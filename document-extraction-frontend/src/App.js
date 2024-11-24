import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import useDataStore from "./store/DataStore";
import InvoicesTable from "./components/Invoices";
import CustomersTable from "./components/Customers";
import ProductsTable from "./components/Products";
import "./App.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    documents,
    setDocuments,
    setCurrentDocument,
    fetchDocuments,
    deleteDocument,
  } = useDataStore();
  const tabRefs = useRef({});
  const slideBoxRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  });

  const renderActiveTab = () => {
    switch (activeTab) {
      case "invoices":
        return <InvoicesTable />;
      case "products":
        return <ProductsTable />;
      case "customers":
        return <CustomersTable />;
      default:
        return <InvoicesTable />;
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (tabRefs.current[activeTab] && slideBoxRef.current) {
      const activeTabElement = tabRefs.current[activeTab];
      slideBoxRef.current.style.width = `${activeTabElement.offsetWidth}px`;
      slideBoxRef.current.style.transform = `translateX(${activeTabElement.offsetLeft}px)`;
    }
  }, [activeTab]);

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post(
        "https://document-extractor-web-application.onrender.com/process-document",
        formData
      );

      const newDocument = {
        name: file.name,
        data: data,
        uploadDate: new Date().toLocaleString(),
      };

      await setDocuments(newDocument);
      setCurrentDocument(newDocument);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (e) => {
    const selectedId = e.target.value;
    const selected = documents.find((doc) => doc.id === selectedId);
    setCurrentDocument(selected || null);
  };

  const handleDeleteDocument = async (docId) => {
    await deleteDocument(docId);
  };
  useEffect(() => {
    const unsubscribe = useDataStore.getState().initializeListener();
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      <div className="upload-section">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,.xlsx,.xls,.jpg,.jpeg"
          className="file-input"
        />
        <button
          onClick={handleFileUpload}
          disabled={loading}
          className="upload-button"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {documents.length > 0 && (
          <div className="document-section">
            <select onChange={handleDocumentSelect} className="document-select">
              <option value="">Select a document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.uploadDate})
                </option>
              ))}
            </select>
            <div className="document-list">
              {documents.map((doc) => (
                <div key={doc.id} className="document-item">
                  <span>
                    {doc.name} ({doc.uploadDate})
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tab-navigation">
        {["invoices", "products", "customers"].map((tab) => (
          <button
            key={tab}
            ref={(el) => (tabRefs.current[tab] = el)}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <div ref={slideBoxRef} className="slide-box"></div>
      </div>

      {renderActiveTab()}
    </div>
  );
};

export default App;
