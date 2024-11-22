import React from "react";
import useDataStore from "../store/DataStore";

const InvoicesTable = () => {
  const { currentDocument } = useDataStore();

  const invoiceData = currentDocument?.data
    ? Object.entries(currentDocument.data).flatMap(
        ([customerName, details]) => {
          const productCount = details["Product Name"]?.length || 0;

          return Array.from({ length: productCount }, (_, index) => ({
            customerName,
            serialNumber: details["Serial Number"]?.[0] || "N/A",
            productName: details["Product Name"]?.[index] || "N/A",
            quantity: details["Quantity"]?.[index] || "N/A",
            tax: details["Tax"]?.[index] || "0.00",
            totalAmount: details["Total Amount"]?.[0] || "0.00",
            date: details["Date"]?.[0] || "N/A",
            phoneNumber: details["Customer Phone number"]?.[0] || "N/A",
          }));
        }
      )
    : [];

  const columns = [
    "Customer Name",
    "Serial Number",
    "Product Name",
    "Quantity",
    "Tax",
    "Total Amount",
    "Date",
    "Phone Number",
  ];

  const containerStyle = {
    margin: "0 auto",
    padding: "0 1rem",
    "@media (min-width: 640px)": { padding: "0 2rem" },
  };

  const tableContainerStyle = {
    overflowX: "auto",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    borderRadius: "0.5rem",
    overflow: "hidden",
  };

  const headerStyle = {
    backgroundColor: "#f7fafc",
    color: "#4a5568",
    textTransform: "uppercase",
    fontWeight: "600",
    fontSize: "0.75rem",
  };

  const headerCellStyle = {
    padding: "0.75rem",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#4a5568",
    textTransform: "uppercase",
    letterSpacing: "wider",
  };

  const rowStyle = {
    ":hover": { backgroundColor: "#f7fafc" },
  };

  const cellStyle = {
    padding: "0.75rem",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "0.875rem",
  };

  return (
    <div style={containerStyle}>
      <div style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div style={tableContainerStyle}>
          {invoiceData.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "1rem", color: "#718096" }}
            >
              No invoice data available
            </div>
          ) : (
            <table style={{ width: "100%", lineHeight: "normal" }}>
              <thead>
                <tr style={headerStyle}>
                  {columns.map((col) => (
                    <th key={col} style={headerCellStyle}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoiceData.map((row, rowIndex) => (
                  <tr key={rowIndex} style={rowStyle}>
                    {columns.map((col) => {
                      let cellValue;
                      switch (col) {
                        case "Customer Name":
                          cellValue = row.customerName;
                          break;
                        case "Serial Number":
                          cellValue = row.serialNumber;
                          break;
                        case "Product Name":
                          cellValue = row.productName;
                          break;
                        case "Quantity":
                          cellValue = row.quantity;
                          break;
                        case "Tax":
                          cellValue = row.tax;
                          break;
                        case "Total Amount":
                          cellValue = row.totalAmount;
                          break;
                        case "Date":
                          cellValue = row.date;
                          break;
                        case "Phone Number":
                          cellValue = row.phoneNumber;
                          break;
                        default:
                          cellValue = "N/A";
                      }
                      return (
                        <td key={col} style={cellStyle}>
                          {cellValue !== undefined ? cellValue : "N/A"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;
