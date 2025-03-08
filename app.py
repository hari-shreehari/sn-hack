import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")
SNOW_INSTANCE = os.getenv("SNOW_INSTANCE")  
SNOW_USER = os.getenv("SNOW_USER")
SNOW_PASS = os.getenv("SNOW_PASS")

# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    )

# Define request body schema
class StockAlertRequest(BaseModel):
    product_id: str

# Fetch product details from ServiceNow using u_number
def get_product_details(product_id):
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_products?sysparm_query=u_number={product_id}&sysparm_limit=1"
    print(url)
    headers = {"Accept": "application/json"}
    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    
    if response.status_code != 200 or not response.json().get("result"):
        raise HTTPException(status_code=404, detail="Product not found in ServiceNow.")
    
    product = response.json()["result"][0]
    return {
        "product_name": product["u_name"],
        "current_stock": product["u_available_stock"],
        "description": product["u_prod_description"],
        "vendor_id": product["u_sold_by"]
    }

# Fetch vendor email from ServiceNow using vendor_id
def get_vendor_email(vendor_id):
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_vendor?sysparm_query=u_vendor_id={vendor_id}&sysparm_limit=1"
    headers = {"Accept": "application/json"}
    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    
    if response.status_code != 200 or not response.json().get("result"):
        raise HTTPException(status_code=404, detail="Vendor not found in ServiceNow.")
    
    vendor = response.json()["result"][0]
    return vendor["u_vendor_mail"]

# Function to send styled HTML email
def send_email(product_id, product_name, recipient_email, current_stock, description):
    try:
        subject = f"Stock Alert: {product_name} (ID: {product_id})"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                    margin: auto;
                }}
                .header {{
                    background-color: #0044cc;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    padding: 20px;
                    font-size: 16px;
                    color: #333;
                    text-align: center;
                }}
                .box {{
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 15px;
                    border-left: 5px solid #0044cc;
                }}
                .footer {{
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">X-Helios Warehouse</div>
                <div class="content">
                    <p>⚠️ <strong>Stock Alert</strong></p>
                    <div class="box">
                        <p>📦 <strong>Product:</strong> {product_name} (ID: {product_id})</p>
                        <p>ℹ️ <strong>Description:</strong> {description}</p>
                        <p>📉 <strong>Current Stock:</strong> {current_stock}</p>
                        <p>Please restock this item and update the inventory.</p>
                    </div>
                </div>
                <div class="footer">
                    This is an automated message from X-Helios Warehouse.
                </div>
            </div>
        </body>
        </html>
        """

        # Set up the MIME email
        msg = MIMEMultipart()
        msg["From"] = EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))  # Use HTML format

        # Connect to SMTP server and send email
        s = smtplib.SMTP("smtp.gmail.com", 587)
        s.ehlo()
        s.starttls()
        s.login(EMAIL, PASSWORD)
        s.sendmail(EMAIL, recipient_email, msg.as_string())
        s.quit()

        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# API endpoint to trigger email
@app.post("/send_stock_alert")
async def send_stock_alert(data: StockAlertRequest):
    # Fetch product details using u_number
    product_details = get_product_details(data.product_id)
    print(product_details)
    # Fetch vendor email using vendor_id
    recipient_email = get_vendor_email(product_details["vendor_id"])
    print(recipient_email)
    # Send email
    return send_email(
        data.product_id,
        product_details["product_name"],
        recipient_email,
        product_details["current_stock"],
        product_details["description"]
    )

@app.get("/")
async def read_route():
    return {"Hello!" : "ServiceNow"}
