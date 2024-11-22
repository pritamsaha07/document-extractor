const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const Tesseract = require("tesseract.js");
const PDFExtract = require("pdf.js-extract").PDFExtract;
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const pdfExtract = new PDFExtract();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Gemini API key is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Function to extract text from PDF
function extractPDFText(filePath) {
  return new Promise((resolve, reject) => {
    pdfExtract.extract(filePath, {}, (err, data) => {
      if (err) {
        return reject(err);
      }
      const pdfContent = data.pages
        .map((page) => page.content.map((item) => item.str).join(" "))
        .join("\n");
      resolve(pdfContent);
    });
  });
}

// Function to extract text from Excel
function extractExcelText(filePath) {
  const workbook = xlsx.readFile(filePath);
  let excelContent = "";

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetContent = xlsx.utils.sheet_to_csv(worksheet);
    excelContent += sheetContent + "\n";
  });

  return excelContent;
}

function extractImageText(filePath) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(filePath, "eng")
      .then(({ data: { text } }) => resolve(text))
      .catch((err) => reject(err));
  });
}

app.get("/read-pdf", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    let documentContent = "";

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
      default:
        return res.status(400).json({ message: "Unsupported file type" });
    }

    res.json({ content: documentContent });

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
app.post("/process-document", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    let documentContent = "";

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
      default:
        return res.status(400).json({ message: "Unsupported file type" });
    }
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: 'Extract the following details from the invoice:\n        Serial Number, Customer Name, Product Name, Quantity, Tax, Total Amount, Date, Customer Phone number and Total Purchase Amount.\n        Return the result in a structured JSON format.                                                                                                        \n   "T A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  EInvoices  GSTIN :   29AABCT1332L000  H/No 1 59/9, M.S.R.Y Nilayam, 4th floor,  Masjid Banda, Kondapur   , Rangareddy, H-  yderabad  Bangalore South,   KARNATAKA,   560030  Mobile:   +91 9999999999  Email:   Swipe@gmail.com  Consignee:  Navya Sri  Buyer (if other than consignee):  74-6-321   Plot no.106  Tagore nagar near to Darpan residency  Hyderabad City , TELANGANA , 500018  Ph: 8965236147  Invoice   #:  INV-TEST-1526  Invoice   Date:  12   Nov 2024  Place of Supply:  36- TELANGANA  Sl   Description   Rate/Item   Quantity   Taxable Value   GST   Amount  1   YONEX ZR 100 LIGHT Racket   25,600.00   7.000   1,79,200.00   0.00 (0%)   1,79,200.00  2   Matrix and Pillows   45,084.7458   1.000   45,084.75   8,115.25  (18%)  53,200.00  Total Items / Qty :   2   /   8.000  Making charges   ₹ 123456.00  debit card charges   ₹ 12345.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Taxable Amount   ₹ 3,60,265.75  IGST   18.0%   ₹ 8,115.25  Total   ₹ 3,68,381.00  Total amount (in words):   INR Three Lakh, Sixty-Eight Thousand, Three Hundred And Eighty-One Rupees Only .  Amount Payable:   ₹ 3,68,381.00  Total Amount due:   ₹ 3,68,381.00  Bank Details:  Bank:   Example Bank  Account #:   1234567890  IFSC Code :   IFSC0001234  Branch:   Main Branch  Beneficiary Name : Vishnu  Pay using UPI:   For   EInvoices  Authorized Signatory  Notes:  THANKS  Terms and Conditions:  1)   The tenant has no right of any kind to have a right title interest in the leased  premises by way of sub-tenant assignment, licensee, caretaker, paying guest  or any other usage of premises in such manner. If tenant does so, the landlord  “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 1 / 2   This is a digitally signed document.\\nT A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  has the right to get the premises vacated.  2)   Tenants missbehaving, squatting on the floor, littering, possessing dang-  erous substance or objects will be evicted.  3)   All utility bills like electricity, gas, water, internet, cleaning etc is to be borne  by the te3) All utility bills like electricity, gas, water, internet, cleaning etc is to  be borne by the te3) All utility bills like electricity, gas, water, internet, cleaning  etc is to be borne by the te3) All utility bills like electricity, gas, water, internet,  cleaning etc is to be borne by the te3) All utility bills like electricity, gas, water,  internet, cleaning etc is to be borne by the te  “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 2 / 2   This is a digitally signed document."',
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: '```json\n{\n  "Serial Number": null, \n  "Customer Name": "Navya Sri",\n  "Product Name": ["YONEX ZR 100 LIGHT Racket", "Matrix and Pillows"],\n  "Quantity": [7.000, 1.000],\n  "Tax": "8,115.25 (18%)",\n  "Total Amount": "3,68,381.00",\n  "Date": "12 Nov 2024",\n  "Customer Phone number": "8965236147",\n  "Total Purchase Amount": "3,68,381.00"\n}\n```\n',
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              text: 'Extract the following details from the invoice:\nSerial Number, Customer Name, Product Name, Quantity, Tax, Total Amount, Date, Customer Phone number and Total Purchase Amount.(all the htings that mutiple values that should be array format]\nReturn the result in a structured JSON format.\n"T A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  EInvoices  GSTIN :   29AABCT1332L000  H/No 1 59/9, M.S.R.Y Nilayam, 4th floor,  Masjid Banda, Kondapur   , Rangareddy, H-  yderabad  Bangalore South,   KARNATAKA,   560030  Mobile:   +91 9999999999  Email:   Swipe@gmail.com  Consignee:  Navya Sri  Buyer (if other than consignee):  74-6-321   Plot no.106  Tagore nagar near to Darpan residency  Hyderabad City , TELANGANA , 500018  Ph: 8965236147  Invoice   #:  INV-TEST-1526  Invoice   Date:  12   Nov 2024  Place of Supply:  36- TELANGANA  Sl   Description   Rate/Item   Quantity   Taxable Value   GST   Amount  1   YONEX ZR 100 LIGHT Racket   25,600.00   7.000   1,79,200.00   0.00 (0%)   1,79,200.00  2   Matrix and Pillows   45,084.7458   1.000   45,084.75   8,115.25  (18%)  53,200.00  Total Items / Qty :   2   /   8.000  Making charges   ₹ 123456.00  debit card charges   ₹ 12345.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Taxable Amount   ₹ 3,60,265.75  IGST   18.0%   ₹ 8,115.25  Total   ₹ 3,68,381.00  Total amount (in words):   INR Three Lakh, Sixty-Eight Thousand, Three Hundred And Eighty-One Rupees Only .  Amount Payable:   ₹ 3,68,381.00  Total Amount due:   ₹ 3,68,381.00  Bank Details:  Bank:   Example Bank  Account #:   1234567890  IFSC Code :   IFSC0001234  Branch:   Main Branch  Beneficiary Name : Vishnu  Pay using UPI:   For   EInvoices  Authorized Signatory  Notes:  THANKS  Terms and Conditions:  1)   The tenant has no right of any kind to have a right title interest in the leased  premises by way of sub-tenant assignment, licensee, caretaker, paying guest  or any other usage of premises in such manner. If tenant does so, the landlord  “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 1 / 2   This is a digitally signed document.\\nT A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  has the right to get the premises vacated.  2)   Tenants missbehaving, squatting on the floor, littering, possessing dang-  erous substance or objects will be evicted.  3)   All utility bills like electricity, gas, water, internet, cleaning etc is to be borne  by the te3) All utility bills like electricity, gas, water, internet, cleaning etc is to  be borne by the te3) All utility bills like electricity, gas, water, internet, cleaning  etc is to be borne by the te3) All utility bills like electricity, gas, water, internet,  cleaning etc is to be borne by the te3) All utility bills like electricity, gas, water,  internet, cleaning etc is to be borne by the te  “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 2 / 2   This is a digitally signed document."',
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: '```json\n{\n  "Serial Number": [],\n  "Customer Name": ["Navya Sri"],\n  "Product Name": ["YONEX ZR 100 LIGHT Racket", "Matrix and Pillows"],\n  "Quantity": [7.000, 1.000],\n  "Tax": ["0.00 (0%)", "8,115.25  (18%)"],\n  "Total Amount": ["3,68,381.00"],\n  "Date": ["12 Nov 2024"],\n  "Customer Phone number": ["8965236147"],\n  "Total Purchase Amount": ["3,68,381.00"]\n}\n```\n',
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              text: 'Extract the following details from the invoice:\nSerial Number, Customer Name, Product Name, Quantity, Tax, Total Amount, Date, Customer Phone number and Total Purchase Amount.(all the htings that mutiple values that should be array format]\nReturn the result in a structured JSON format. example{custimername:{serial number:{},productanme:{, quantity:{}}}"T A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  EInvoices  GSTIN :   29AABCT1332L000  H/No 1 59/9, M.S.R.Y Nilayam, 4th floor,  Masjid Banda, Kondapur   , Rangareddy, H-  yderabad  Bangalore South,   KARNATAKA,   560030  Mobile:   +91 9999999999  Email:   Swipe@gmail.com  Consignee:  Shounak  NextSpeed Technologies Pvt Ltd  GSTIN :   ABCDE1234567890  Ph: 9999999994  Invoice   #:  INV-148CZS  Invoice   Date:  12   Nov 2024  Place of Supply:  29- KARNATAKA  Sl   Description   Rate/Item   Quantity   Taxable Value   GST   Amount  1   GEMS CHOCLATE POUCH   4.7619   1,000.000   4,761.90   238.10 (5%)   5,000.00  2   TREAT BKS CASE 80PKT   535.7143   50.000   26,785.71   3,214.29  (12%)  30,000.00  3   NUTRI CHOICE BKS CASE   666.6667   25.000   16,666.67   833.33 (5%)   17,500.00  4   MILK BIKIS CLASSIC CASE 120PK   809.5238   20.000   16,190.48   809.52 (5%)   17,000.00  Total Items / Qty :   4   /   1,095.000  Making charges   ₹ 123456.00  debit card charges   ₹ 12345.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Shipping Charges   ₹ 60.00  Taxable Amount   ₹ 2,00,385.76  CGST   2.5%   ₹ 940.48  SGST   2.5%   ₹ 940.48  CGST   6.0%   ₹ 1,607.14  SGST   6.0%   ₹ 1,607.14  Total   ₹ 2,05,481.00  Total amount (in words):   INR Two Lakh, Five Thousand, Four Hundred And Eighty-One Rupees Only .  Amount Payable:   ₹ 2,05,481.00  Total Amount due:   ₹ 2,05,481.00  Bank Details:  Bank:   Example Bank  Account #:   1234567890  IFSC Code :   IFSC0001234  Branch:   Main Branch  Beneficiary Name : Vishnu  Pay using UPI:   For   EInvoices  Authorized Signatory  Notes:  THANKS  Terms and Conditions:  1)   The tenant has no right of any kind to have a right title interest in the leased  premises by way of sub-tenant assignment, licensee, caretaker, paying guest “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 1 / 2   This is a digitally signed document.\\nT A X I N V O I C E   O R I G I N A L F O R R E C I P I E N T  or any other usage of premises in such manner. If tenant does so, the landlord  has the right to get the premises vacated.  2)   Tenants missbehaving, squatting on the floor, littering, possessing dang-  erous substance or objects will be evicted.  3)   All utility bills like electricity, gas, water, internet, cleaning etc is to be borne  by the te3) All utility bills like electricity, gas, water, internet, cleaning etc is to  be borne by the te3) All utility bills like electricity, gas, water, internet, cleaning  etc is to be borne by the te3) All utility bills like electricity, gas, water, internet,  cleaning etc is to be borne by the te3) All utility bills like electricity, gas, water,  internet, cleaning etc is to be borne by the te  “ SUPPLY TO SEZ UNIT FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX OR UNDER BOND OR  LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX.  Page 2 / 2   This is a digitally signed document."',
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: 'The requested JSON format is a bit unclear and might not be the most suitable way to represent the extracted information.  A nested format like `{customername: {serialnumber: {}, productname: {}}}` implies a hierarchy that isn\'t present in the invoice data. It\'s more appropriate to group invoice details as a single unit.\n\nHere\'s the extracted information in a standard, flattened JSON format that\'s easier to work with:\n\n```json\n{\n  "Serial Number": [],\n  "Customer Name": "Shounak",\n  "Product Name": [\n    "GEMS CHOCLATE POUCH",\n    "TREAT BKS CASE 80PKT",\n    "NUTRI CHOICE BKS CASE",\n    "MILK BIKIS CLASSIC CASE 120PK"\n  ],\n  "Quantity": [\n    1000.000,\n    50.000,\n    25.000,\n    20.000\n  ],\n  "Tax": [\n    "238.10 (5%)",\n    "3,214.29  (12%)",\n    "833.33 (5%)",\n    "809.52 (5%)"\n  ],\n  "Total Amount": "2,05,481.00",\n  "Date": "12 Nov 2024",\n  "Customer Phone number": "9999999994",\n  "Total Purchase Amount": "2,05,481.00"\n}\n```\n\n\nIf you absolutely need a nested structure, please clarify the desired hierarchy.  For example, should products be nested under the customer?  Or should tax amounts be nested under respective product names? Providing a clearer description will allow for generating a more accurate JSON output.\n',
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              text: '"Serial Number,Invoice Date,Item Total Amount,Product Name,Qty,Price with Tax,Unit,Tax (%),Party Name,Party Company Name,Status\\nRAY/23-24/286,12 Nov 2024,69183.35,iPHONE 16,1.000,79990.00,OTH,18,Shounak,NextSpeed Technologies Pvt Ltd,pending\\nRAY/23-24/286,12 Nov 2024,3977.68,iPHONE 16 Cover,1.000,4599.00,OTH,18,Shounak,NextSpeed Technologies Pvt Ltd,pending\\nRAY/23-24/286,12 Nov 2024,21621.64,Beats PRO X,1.000,24999.00,OTH,18,Shounak,NextSpeed Technologies Pvt Ltd,pending\\nRAY/23-24/285,12 Nov 2024,10000.00,SPEAKER,1.000,10000.00,OTH,0,Abhinav,GAME STATION,pending\\nRAY/23-24/284,08 Nov 2024,88.98,12 MM PLAIN GLASS,1.000,88.98,SQF,0,Ramesh,Apple India,pending\\nRAY/23-24/283,08 Nov 2024,88.98,12 MM PLAIN GLASS,1.000,88.98,SQF,0,Ramesh,Apple India,pending\\nRAY/23-24/282,07 Nov 2024,37.08,12 MM PLAIN GLASS,500.000,0.07,SQF,0,RAM,Apple India,pending\\nRAY/23-24/281,07 Nov 2024,88.98,12 MM PLAIN GLASS,1.000,88.98,SQF,0,RAM,Apple India,pending\\nRAY/23-24/280,06 Nov 2024,105.00,12 MM PLAIN GLASS,1.000,105.00,SQF,18,Ramesh,Apple India,pending\\nRAY/23-24/280,06 Nov 2024,0.00,plain glass,1.000,0.00,OTH,18,Ramesh,Apple India,pending\\nRAY/23-24/279,05 Nov 2024,20.00,Ct Sheet,3.000,500.00,OTH,0,Abhinav,GAME STATION,pending\\nRAY/23-24/278,05 Nov 2024,105.00,12 MM PLAIN GLASS,1.000,105.00,SQF,18,Decathlon,DECATHLON SPORTS INDIA PRIVATE LIMITED,pending\\nRAY/23-24/277,02 Nov 2024,20475.00,12 MM PLAIN GLASS,15.000,11.50,SQF,18,Abhinav,GAME STATION,pending\\nRAY/23-24/276,01 Nov 2024,708.00,plain glass,1.000,708.00,OTH,18,geeetha,Flipkart Co,pending\\nRAY/23-24/275,01 Nov 2024,55000.00,plain glass,100.000,590.00,OTH,18,geeetha,Flipkart Co,paid\\n,,,,,,,,,,\\nTotals,,181499.69,,629,,,,,,\\n,,,,,,,,,,\\n,,,,CGST,\\"11,486.11\\",,,,,\\n,,,,SGST,\\"11,486.11\\",,,,,\\n,,,,IGST,\\"3,139.33\\",,,,,\\n,,,,ITEM NET AMOUNT,\\"155,388.13\\",,,,,\\n,,,,ITEM TOTAL AMOUNT,\\"181,499.69\\",,,,,\\n,,,,QTY,629.0,,,,,\\n,,,,EXTRA DISCOUNT,0.0,,,,,\\n,,,,ROUND OFF AMOUNT,0.019999999999999997,,,,,\\n,,,,CESS,0.0,,,,,\\n"Extract the following details from the invoice:\nSerial Number, Customer Name, Product Name, Quantity, Tax, Total Amount, Date, Customer Phone number and Total Purchase Amount.(all the htings that mutiple values that should be array format]\nReturn the result in a structured JSON format. example{custimername:{serial number:{},productanme:{, quantity:{}}} it will customer name on top then products then for restive product tax and cost and other things \n',
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: '```json\n{\n  "Shounak": {\n    "Serial Number": ["RAY/23-24/286", "RAY/23-24/286", "RAY/23-24/286"],\n    "Product Name": ["iPHONE 16", "iPHONE 16 Cover", "Beats PRO X"],\n    "Quantity": [1.000, 1.000, 1.000],\n    "Price with Tax": [79990.00, 4599.00, 24999.00],\n    "Tax (%)": [18, 18, 18],\n    "Item Total Amount": [69183.35, 3977.68, 21621.64],\n    "Date": "12 Nov 2024",\n    "Company Name": "NextSpeed Technologies Pvt Ltd"\n },\n  "Abhinav": {\n    "Serial Number": ["RAY/23-24/285", "RAY/23-24/279", "RAY/23-24/277"],\n    "Product Name": ["SPEAKER", "Ct Sheet", "12 MM PLAIN GLASS"],\n    "Quantity": [1.000, 3.000, 15.000],\n    "Price with Tax": [10000.00, 500.00, 11.50],\n    "Tax (%)": [0, 0, 18],\n    "Item Total Amount": [10000.00, 20.00, 20475.00],\n    "Date": ["12 Nov 2024", "05 Nov 2024", "02 Nov 2024"],\n    "Company Name": "GAME STATION"\n  },\n  "Ramesh": {\n    "Serial Number": ["RAY/23-24/284", "RAY/23-24/283", "RAY/23-24/280", "RAY/23-24/280"],\n    "Product Name": ["12 MM PLAIN GLASS", "12 MM PLAIN GLASS", "12 MM PLAIN GLASS", "plain glass"],\n    "Quantity": [1.000, 1.000, 1.000, 1.000],\n    "Price with Tax": [88.98, 88.98, 105.00, 0.00],\n    "Tax (%)": [0, 0, 18, 18],\n    "Item Total Amount": [88.98, 88.98, 105.00, 0.00],\n    "Date": ["08 Nov 2024", "08 Nov 2024", "06 Nov 2024", "06 Nov 2024"],\n    "Company Name": "Apple India"\n  },\n  "RAM": {\n    "Serial Number": ["RAY/23-24/282", "RAY/23-24/281"],\n    "Product Name": ["12 MM PLAIN GLASS", "12 MM PLAIN GLASS"],\n    "Quantity": [500.000, 1.000],\n    "Price with Tax": [0.07, 88.98],\n    "Tax (%)": [0, 0],\n    "Item Total Amount": [37.08, 88.98],\n    "Date": "07 Nov 2024",\n    "Company Name": "Apple India"\n  },\n  "Decathlon": {\n    "Serial Number": ["RAY/23-24/278"],\n    "Product Name": ["12 MM PLAIN GLASS"],\n    "Quantity": [1.000],\n    "Price with Tax": [105.00],\n    "Tax (%)": [18],\n    "Item Total Amount": [105.00],\n    "Date": "05 Nov 2024",\n    "Company Name": "DECATHLON SPORTS INDIA PRIVATE LIMITED"\n  },\n  "geeetha": {\n    "Serial Number": ["RAY/23-24/276", "RAY/23-24/275"],\n    "Product Name": ["plain glass", "plain glass"],\n    "Quantity": [1.000, 100.000],\n    "Price with Tax": [708.00, 590.00],\n    "Tax (%)": [18, 18],\n    "Item Total Amount": [708.00, 55000.00],\n    "Date": "01 Nov 2024",\n    "Company Name": "Flipkart Co"\n  },\n  "Total Amount": 181499.69,\n    "CGST": 11486.11,\n    "SGST": 11486.11,\n    "IGST": 3139.33,\n  "Net Amount": 155388.13\n}\n```',
            },
          ],
        },
      ],
    });

    const AI_PROMPT = `Extract the following details from the invoice:
Serial Number, Customer Name, Product Name, Quantity, Tax, Total Amount, Date, Customer Phone number and Total Purchase Amount.(all the htings that mutiple values that should be array format]
Return the result in a structured JSON format. example{custimername:{serial number:{},productanme:{, quantity:{}}} it will customer name on top then products then for restive product tax and cost and other things
      
      Document Text:
      ${documentContent}`;

    try {
      const result = await chatSession.sendMessage(AI_PROMPT);
      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      console.error("AI Processing Error:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
