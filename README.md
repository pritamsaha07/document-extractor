# Document Extraction Project Setup

## Project Overview
A full-stack document processing application using AI to extract structured information from various document types (PDF, Excel, Images).

## Endpoints

### POST /process-document
Processes uploaded documents and extracts structured information using AI.

#### Request
- Method: POST
- Content-Type: multipart/form-data
- Body: 
  - `file`: Document file (PDF, XLSX, XLS, PNG, JPG, JPEG)

#### Document Processing Flow
1. **File Upload & Text Extraction**
```javascript
// Based on file type, extract text using appropriate method
switch (fileExt) {
  case ".pdf":
    documentContent = await extractPDFText(filePath);
    break;
  case ".xlsx":
  case ".xls":
    documentContent = extractExcelText(filePath);
    break;
  case ".png":
  case ".jpg":
  case ".jpeg":
    documentContent = await extractImageText(filePath);
    break;
}
```

2. **AI Processing Configuration**
```javascript
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// Configure AI generation parameters
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json"
};
```

3. **AI Prompt Structure**
```javascript
const AI_PROMPT = `
Extract the following details from the invoice:
Serial Number, Customer Name, Product Name, Quantity, Tax, 
Total Amount, Date, Customer Phone number and Total Purchase Amount.
(all the things that have multiple values should be in array format)
Return the result in a structured JSON format with customer name on top, 
then products with their respective tax and cost details.

Document Text:
${documentContent}`;
```

4. **AI Processing & Response**
```javascript
const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [{ text: AI_PROMPT }]
    }
  ]
});

const result = await chatSession.sendMessage(AI_PROMPT);
```

#### Response
Returns a JSON object containing extracted information structured by customer:
```json
{
  "customerName": {
    "Serial Number": ["ABC123", "ABC124"],
    "Product Name": ["Product 1", "Product 2"],
    "Quantity": [1.0, 2.0],
    "Price with Tax": [1000.00, 2000.00],
    "Tax (%)": [18, 18],
    "Item Total Amount": [1000.00, 2000.00],
    "Date": "2024-01-01",
    "Company Name": "Company XYZ"
  },
  "Total Amount": 3000.00,
  "CGST": 270.00,
  "SGST": 270.00,
  "IGST": 0.00,
  "Net Amount": 2460.00
}
```

#### Error Handling
```javascript
try {
  const result = await chatSession.sendMessage(AI_PROMPT);
  res.json(JSON.parse(result.response.text()));
} catch (error) {
  console.error("AI Processing Error:", error);
  res.status(500).json({ message: "Failed to process document" });
}
```

#### Key Features of AI Extraction
1. **Structured Output**: Returns data in a consistent JSON format
2. **Multiple Item Support**: Handles multiple products per customer
3. **Tax Calculation**: Extracts and categorizes different tax types
4. **Flexible Document Support**: Works with various document formats
5. **Error Handling**: Robust error handling for AI processing
6. **Data Validation**: Ensures extracted data meets expected format
7. **History Context**: Maintains chat history for improved accuracy

# Prerequisites To Run Project In Local Environment

## Required Software
- **NodeJs** v16.x or higher
- **NPM** (Node Package Manager) v8.x or higher
- **Git** for version control

## Development Tools
- **CodeEditor**: VSCode, Sublime Text, or similar
- **Postman**: For API testing (optional)
- **GitClient**: GitHub Desktop or similar (optional)



# Environment Variables

```bash
git clone <repository-url>
```
## Backend Setup



### Installation Steps
1. Navigate to backend directory
```bash
cd document-extraction-backend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
- Create a `.env` file
- Add necessary API keys (Google Gemini, etc.)

4. Start backend server
```bash
node server.js
```

### Backend Key Dependencies
- Express.js
- Multer (file upload)
- pdf-parse
- xlsx
- tesseract.js
- @google/generative-ai

## Frontend Setup

### Installation Steps
1. Navigate to frontend directory
```bash
cd document-extraction-frontend
```

2. Install dependencies
```bash
npm install
```

3. Update API Configuration
- Open `src/app.js`
- Replace API endpoint:
```javascript
const API_BASE_URL = 'http://localhost:3000/';
```

4. Start frontend application
```bash
npm start
```

