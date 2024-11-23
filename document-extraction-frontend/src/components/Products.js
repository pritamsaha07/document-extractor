import React, { useMemo, useState } from "react";
import { Edit } from "lucide-react";
import useDataStore from "../store/DataStore";

const ProductsTable = () => {
  const { currentDocument, updateDocument } = useDataStore();
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedValues, setEditedValues] = useState({});

  const productsData = useMemo(() => {
    if (!currentDocument?.data) return [];

    const productMap = new Map();

    Object.entries(currentDocument.data).forEach(([customerName, details]) => {
      if (!details["Product Name"]) return;

      details["Product Name"].forEach((productName, index) => {
        const quantity = Number(details["Quantity"]?.[index] || 1);

        const totalAmount = Number(
          (Array.isArray(details["Total Amount"])
            ? details["Total Amount"][0]
            : details["Total Amount"] || "0"
          )
            .toString()
            .replace(",", "") || 0
        );

        const taxValue = details["Tax"]?.[index];
        const tax =
          typeof taxValue === "string"
            ? Number(taxValue.split(" ")[0].replace(",", "") || 0)
            : Number(taxValue || 0);

        if (!productMap.has(productName)) {
          productMap.set(productName, {
            name: productName,
            totalQuantity: quantity,
            totalAmount: totalAmount,
            totalTax: tax,
            customers: new Set([customerName]),
          });
        } else {
          const existingProduct = productMap.get(productName);
          existingProduct.totalQuantity += quantity;
          existingProduct.totalAmount += totalAmount;
          existingProduct.totalTax += tax;
          existingProduct.customers.add(customerName);
        }
      });
    });

    return Array.from(productMap.values()).map((product) => ({
      ...product,
      customers: Array.from(product.customers),
      unitPrice: product.totalAmount / product.totalQuantity,
      priceWithTax: product.totalAmount + product.totalTax,
    }));
  }, [currentDocument]);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditedValues({
      totalQuantity: product.totalQuantity,
      unitPrice: product.unitPrice,
      totalTax: product.totalTax,
    });
  };

  const handleInputChange = (field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (editingProduct && currentDocument) {
      const updatedData = { ...currentDocument.data };

      Object.keys(updatedData).forEach((customerName) => {
        if (!updatedData[customerName]["Product Name"]) return;

        const productIndices = updatedData[customerName]["Product Name"].reduce(
          (indices, name, index) => {
            if (name === editingProduct.name) indices.push(index);
            return indices;
          },
          []
        );

        productIndices.forEach((index) => {
          const newTotalAmount =
            editedValues.totalQuantity * editedValues.unitPrice;

          if (Array.isArray(updatedData[customerName]["Quantity"])) {
            updatedData[customerName]["Quantity"][index] =
              editedValues.totalQuantity;
          }

          if (Array.isArray(updatedData[customerName]["Total Amount"])) {
            updatedData[customerName]["Total Amount"][index] = newTotalAmount;
          }

          if (Array.isArray(updatedData[customerName]["Tax"])) {
            updatedData[customerName]["Tax"][index] = editedValues.totalTax;
          }
        });
      });

      await updateDocument(currentDocument.id, { data: updatedData });
      setEditingProduct(null);
      setEditedValues({});
    }
  };
  const columns = [
    "Product Name",
    "Quantity",
    "Unit Price",
    "Total Tax",
    "Price with Tax",
    "Customers",
    "Actions",
  ];

  return (
    <div style={containerStyle}>
      <div style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div style={tableContainerStyle}>
          {productsData.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "1rem", color: "#718096" }}
            >
              No product data available
            </div>
          ) : (
            <table style={{ width: "100%", lineHeight: "normal" }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} style={headerCellStyle}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productsData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {editingProduct?.name === row.name ? (
                      <>
                        <td style={cellStyle}>{row.name}</td>
                        <td style={cellStyle}>
                          <input
                            type="number"
                            value={editedValues.totalQuantity}
                            onChange={(e) =>
                              handleInputChange(
                                "totalQuantity",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td style={cellStyle}>
                          <input
                            type="number"
                            value={editedValues.unitPrice}
                            onChange={(e) =>
                              handleInputChange(
                                "unitPrice",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td style={cellStyle}>
                          <input
                            type="number"
                            value={editedValues.totalTax}
                            onChange={(e) =>
                              handleInputChange(
                                "totalTax",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td style={cellStyle}>
                          {(
                            editedValues.totalQuantity *
                              editedValues.unitPrice +
                            editedValues.totalTax
                          ).toFixed(2)}
                        </td>
                        <td style={cellStyle}>{row.customers.join(", ")}</td>
                        <td style={cellStyle}>
                          <button
                            style={actionButtonStyle}
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            style={actionButtonStyle}
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={cellStyle}>{row.name}</td>
                        <td style={cellStyle}>{row.totalQuantity}</td>
                        <td style={cellStyle}>{row.unitPrice.toFixed(2)}</td>
                        <td style={cellStyle}>{row.totalTax.toFixed(2)}</td>
                        <td style={cellStyle}>{row.priceWithTax.toFixed(2)}</td>
                        <td style={cellStyle}>{row.customers.join(", ")}</td>
                        <td style={cellStyle}>
                          <button
                            style={actionButtonStyle}
                            onClick={() => handleEditProduct(row)}
                          >
                            <Edit size={18} color="#4a5568" />
                          </button>
                        </td>
                      </>
                    )}
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

export default ProductsTable;
const containerStyle = {
  margin: "0 auto",
  padding: "0 1rem",
};

const tableContainerStyle = {
  overflowX: "auto",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  borderRadius: "0.5rem",
  overflow: "hidden",
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

const cellStyle = {
  padding: "0.75rem",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "0.875rem",
};

const actionButtonStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  marginRight: "10px",
};
