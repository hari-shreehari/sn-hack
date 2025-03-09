import os
from datetime import datetime
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")
SNOW_INSTANCE = os.getenv("SNOW_INSTANCE")  
SNOW_USER = os.getenv("SNOW_USER")
SNOW_PASS = os.getenv("SNOW_PASS")
google_api_key = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=google_api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

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
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_vendor?sysparm_query=u_number={vendor_id}&sysparm_limit=1"
    
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


class RecommendationRequest(BaseModel):
    user_id: str

# Fetch past orders for a user
def get_user_orders(user_id):
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_orders?sysparm_query=u_cust_id={user_id}&sysparm_limit=10"
    headers = {"Accept": "application/json"}

    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching orders.")

    data = response.json().get("result", [])
    return [order["u_prod_id"] for order in data] if data else []

# Fetch trending products (orders from the same month)
def get_trending_products():
    current_month = datetime.now().month
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_orders?sysparm_query=MONTH(u_order_date)={current_month}&sysparm_limit=20"
    headers = {"Accept": "application/json"}

    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching trending products.")

    data = response.json().get("result", [])
    return list(set(order["u_prod_id"] for order in data)) if data else []

# Fetch product details for given product IDs
def get_product_details_bulk(product_ids):
    if not product_ids:
        return {}

    query = "u_numberIN" + ",".join(product_ids)
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_products?sysparm_query={query}"
    headers = {"Accept": "application/json"}

    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching product details.")

    products = response.json().get("result", [])
    return {p["u_number"]: {"name": p["u_name"], "description": p["u_prod_description"]} for p in products}

# Fetch all available products
def get_all_products():
    url = f"{SNOW_INSTANCE}/api/now/table/u_xhelios_products?sysparm_limit=50"
    headers = {"Accept": "application/json"}

    response = requests.get(url, auth=(SNOW_USER, SNOW_PASS), headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching available products.")

    products = response.json().get("result", [])
    return {p["u_number"]: {"name": p["u_name"], "description": p["u_prod_description"]} for p in products}

# Get recommendations from Gemini
def get_recommendations(user_products, trending_products, all_products):
    prompt = f"""
    A user has purchased the following products:
    
    {json.dumps(user_products, indent=2)}

    Only if no products are found, recommend items based on these trending purchases of month:
    
    {json.dumps(trending_products, indent=2)}

    Based on these, predict what other products the user might be interested in.
    Return a JSON list of recommended 5 to 10 product IDs from the available products.
    Format the response as: {{"recommended_products": ["PROD0002001", "PROD0003005", ...]}}

    Here are all the available products in the warehouse:
    {json.dumps(all_products, indent=2)}
    """

    response = model.generate_content(prompt)

    try:
        response_text=response.text
        response_text=response_text.split("```json", 1)[1]
        response_text=response_text.rsplit("```", 1)[0]
        response_json = json.loads(response_text)

        return response_json.get("recommended_products", [])
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(status_code=500, detail="Gemini response could not be parsed.")

# API endpoint to get recommendations
@app.post("/get_recommendations")
async def recommend_products(request: RecommendationRequest):
    try:
        past_orders = get_user_orders(request.user_id)
        user_products = get_product_details_bulk(past_orders)
   
        trending_products = get_trending_products()
        trending_products_full = get_product_details_bulk(trending_products)

        all_products = get_all_products()

        recommended_product_ids = get_recommendations(user_products, trending_products_full, all_products)
        
        return {"recommended_products": recommended_product_ids}
    except HTTPException as e:
        return {"error": e.detail}


# API endpoint to trigger email
@app.post("/send_stock_alert")
async def send_stock_alert(data: StockAlertRequest):
    # Fetch product details using u_number
    product_details = get_product_details(data.product_id)

    # Fetch vendor email using vendor_id
    recipient_email = get_vendor_email(product_details["vendor_id"])

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
