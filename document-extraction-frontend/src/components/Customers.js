import React from "react";
import useDataStore from "../store/DataStore";

const CustomersTable = () => {
  const { currentDocument } = useDataStore();

  const customersData = currentDocument?.data
    ? Object.entries(currentDocument.data).map(([customerName, details]) => {
        const totalAmount = Array.isArray(details["Total Amount"])
          ? details["Total Amount"].reduce(
              (sum, amount) => sum + (Number(amount) || 0),
              0
            )
          : Number(details["Total Amount"]) || 0;

        const taxPaid = Array.isArray(details["Tax"])
          ? details["Tax"].reduce((sum, tax) => sum + (Number(tax) || 0), 0)
          : Number(details["Tax"]) || 0;

        return {
          name: customerName,
          phoneNumber: details["Customer Phone number"]?.[0] || "N/A",
          totalPurchaseAmount: totalAmount,
          invoiceCount: Array.isArray(details["Serial Number"])
            ? details["Serial Number"].length
            : 0,
          taxPaid: taxPaid,
        };
      })
    : [];

  const columns = [
    "Customer Name",
    "Phone Number",
    "Total Purchase Amount",
    "Invoice Count",
    "Total Tax Paid",
  ];

  const containerStyle = {
    width: "100%",
    overflowX: "auto",
    padding: "1rem",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const headerStyle = {
    backgroundColor: "#f7fafc",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "left",
    padding: "0.75rem",
    fontWeight: "bold",
    fontSize: "0.875rem",
    textTransform: "uppercase",
  };

  const cellStyle = {
    padding: "0.75rem",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "0.875rem",
  };

  const noDataStyle = {
    textAlign: "center",
    padding: "1rem",
    color: "#718096",
  };

  return (
    <div style={containerStyle}>
      <div style={{ overflowX: "auto" }}>
        {customersData.length === 0 ? (
          <p style={noDataStyle}>No customer data available</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} style={headerStyle}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customersData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td style={cellStyle}>{row.name}</td>
                  <td style={cellStyle}>{row.phoneNumber}</td>
                  <td style={cellStyle}>
                    {row.totalPurchaseAmount.toFixed(2)}
                  </td>
                  <td style={cellStyle}>{row.invoiceCount}</td>
                  <td style={cellStyle}>{row.taxPaid.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomersTable;
