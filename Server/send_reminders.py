import os
import sys
import smtplib
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from supabase import create_client, Client

# Configure logging with a simpler format and INFO level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("reminders.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SMTP_SERVER = os.getenv("SMTP_SERVER")
# Handle empty SMTP_PORT by using a default value when it's empty
SMTP_PORT_STR = os.getenv("SMTP_PORT", "587")
SMTP_PORT = int(SMTP_PORT_STR) if SMTP_PORT_STR else 587
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Check for required environment variables
required_env_vars = [
    'SUPABASE_URL', 'SUPABASE_KEY',
    'SMTP_SERVER', 'SMTP_PORT', 'EMAIL_USERNAME', 'EMAIL_PASSWORD'
]
missing_env_vars = [var for var in required_env_vars if not globals().get(var)]
if missing_env_vars:
    logger.critical(f"Missing required environment variables: {', '.join(missing_env_vars)}")
    sys.exit(1)

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Database connection established")
except Exception as e:
    logger.critical(f"Database connection failed: {str(e)}")
    sys.exit(1)

# Initialize Jinja2 environment for email templates
env = Environment(loader=FileSystemLoader('templates'))

class LicenseReminderService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.tables = {
            "drivers": "drivers",
            "firearms": "firearms",
            "prpd": "prpd",
            "vehicles": "vehicles",
            "works": "works",
            "other_documents": "other_documents",
            "passports": "passports",
            "tv_licenses": "tv_licenses",
            "psira_records": "psira_records",
            "competency": "competency"
        }

    def get_license_data(self, user_id: str) -> Tuple[List[Dict], ...]:
        """Fetch license-related data from the Supabase database."""
        try:
            # First get all license type settings for this user
            response = self.supabase.table("license_type_settings").select("*").eq("user_id", user_id).execute()
            license_settings = response.data or []
            
            # Map license types used in settings to their actual table names
            type_to_table_map = {
                "drivers": "drivers",
                "firearms": "firearms",
                "prpd": "prpd",
                "vehicles": "vehicles",
                "works": "works",
                "others": "other_documents",
                "passports": "passports",
                "tvlicenses": "tv_licenses",
                "psira": "psira_records",
                "competency": "competency"
            }
            
            # Log settings info concisely
            if license_settings:
                logger.info(f"User {user_id}: Found {len(license_settings)} license type settings")
            
            results = [license_settings]

            # Tables that have status column
            status_tables = ['drivers', 'firearms', 'prpd', 'vehicles', 'works', 'psira_records', 'competency']
            
            found_count = 0
            for table_name in self.tables.values():
                try:
                    # Simple query without complex filters
                    response = self.supabase.table(table_name).select("*").eq("user_id", user_id).execute()
                    
                    # Filter in Python instead of SQL
                    data = response.data or []
                    filtered_data = []
                    
                    # Use the correct expiry date field based on table
                    expiry_field = 'expiry_date'
                    if table_name == 'psira_records':
                        expiry_field = 'certificate_expiry_date'
                    
                    for item in data:
                        # Skip items with null expiry_date
                        expiry_value = item.get(expiry_field)
                        if not expiry_value:
                            continue
                            
                        # For tables with status, check if status is active
                        if table_name in status_tables:
                            # Special check for psira_records
                            if table_name == 'psira_records':
                                if item.get("reg_status") != "ACTIVE":
                                    continue
                            elif item.get("status") != "active":
                                continue
                            
                        # Add to filtered data
                        item['table'] = table_name
                        item['actual_expiry_field'] = expiry_field # Track which field holds the expiry
                        filtered_data.append(item)
                    
                    found_count += len(filtered_data)
                    
                    # Get reminder settings for each item
                    settings_type = table_name # Default to table name
                    for type_key, tbl_val in type_to_table_map.items():
                        if tbl_val == table_name:
                            settings_type = type_key
                            break
                            
                    settings_response = self.supabase.table("license_type_settings") \
                        .select("reminder_days_before,reminder_frequency,notifications_enabled") \
                        .eq("user_id", user_id) \
                        .eq("type", settings_type) \
                        .execute()
                    
                    # Apply settings to each license item
                    if settings_response.data:
                        for item in filtered_data:
                            settings_data = settings_response.data[0]
                            item["reminder_days_before"] = settings_data.get("reminder_days_before", 7) # Default to 7
                            item["reminder_frequency"] = settings_data.get("reminder_frequency", "weekly") # Default to weekly
                            item["notifications_enabled_type"] = settings_data.get("notifications_enabled", False) # Check if enabled for this type
                    
                    results.append(filtered_data)
                except Exception as e:
                    logger.warning(f"Error fetching {table_name} data: {str(e)}")
                    results.append([])
            
            if found_count > 0:
                logger.info(f"User {user_id}: Found {found_count} total licenses/documents")
            return tuple(results)
        except Exception as e:
            logger.error(f"Data fetch error for user {user_id}: {str(e)}")
            return tuple([[] for _ in range(len(self.tables) + 1)])

    def filter_expiring_licenses(self, data: List[Dict[str, Any]], days_before: int) -> Tuple[List[Dict], List[Dict]]:
        """Filter licenses expiring within a specified number of days."""
        expiring_licenses = []
        paused_licenses = []
        
        for item in data:
            try:
                # Use the correct expiry field
                expiry_field = item.get('actual_expiry_field', 'expiry_date')
                expiry_date_str = item.get(expiry_field)
                
                if not expiry_date_str:
                    continue
                
                # Parse expiry_date if it's a string
                if isinstance(expiry_date_str, str):
                    expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
                elif isinstance(expiry_date_str, datetime):
                    expiry_date = expiry_date_str.date()
                else:
                    continue # Skip if not a valid date type
                    
                # Calculate days until expiration
                days_until_expiry = (expiry_date - datetime.now().date()).days
                
                # Get reminder days setting for this license
                reminder_days = item.get('reminder_days_before', days_before)
                
                # Check if notifications are enabled for this specific type
                notifications_enabled = item.get('notifications_enabled_type', False)
                if not notifications_enabled:
                    continue
                
                # Check if we should send reminder today
                if 0 <= days_until_expiry <= reminder_days:
                    if item.get("notifications_paused", False):
                        paused_licenses.append(item)
                        continue
                    expiring_licenses.append(item)
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid date format for item ID {item.get('id')} field {expiry_field}: {e}")
                continue
            
        return expiring_licenses, paused_licenses

    def send_email(self, to_email: str, subject: str, body: Dict[str, str]) -> Dict[str, Any]:
        """Send an HTML email notification."""
        try:
            msg = MIMEMultipart('alternative')
            msg["Subject"] = subject
            msg["From"] = EMAIL_USERNAME
            msg["To"] = to_email

            msg.attach(MIMEText(body['plain'], 'plain'))
            msg.attach(MIMEText(body['html'], 'html'))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
                server.send_message(msg)
                
                logger.info(f"Email sent to {to_email}")
                
                return {
                    "success": True,
                    "to_email": to_email,
                    "subject": subject,
                    "sent_at": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Email failed to {to_email}: {str(e)}")
            return {
                "success": False,
                "to_email": to_email,
                "subject": subject,
                "error": str(e),
                "attempted_at": datetime.now().isoformat()
            }

    def create_notification(self, user_id: str, license_item: Dict[str, Any], message: str) -> None:
        """Create a notification record in the notifications table."""
        try:
            notification_data = {
                "user_id": user_id,
                "license_type": license_item["table"],
                "license_id": license_item["id"],
                "message": message,
                "read": False
            }
            
            self.supabase.table("notifications").insert(notification_data).execute()
        except Exception as e:
            logger.error(f"Failed to create notification for {user_id}: {str(e)}")

    def check_last_pause_notification(self, user_id: str, license_id: str) -> bool:
        """Check if a pause notification was sent in the last 5 days for this license."""
        try:
            five_days_ago = (datetime.now() - timedelta(days=5)).isoformat()
            
            response = self.supabase.table("notifications") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("license_id", license_id) \
                .like("message", "Notifications paused until%") \
                .gte("created_at", five_days_ago) \
                .execute()
            
            return len(response.data) == 0
        except Exception as e:
            logger.error(f"Notification check error: {str(e)}")
            return False  # On error, don't send notification

    def build_email_body(self, user: Dict[str, Any], expiring_licenses: List[Dict[str, Any]], paused_licenses: List[Dict[str, Any]] = None) -> Dict[str, str]:
        """Construct the email body using templates."""
        template = env.get_template('email_template.html')
        html_content = template.render(
            user=user,
            expiring_licenses=expiring_licenses,
            paused_licenses=paused_licenses or [],
            license_service=self
        )

        plain_text = f"Hello {user['first_name']} {user['last_name']},\n\n"
        plain_text += "The following licenses/documents are nearing their expiry date:\n\n"
        for license_item in expiring_licenses:
            item_text = self.format_license_text(license_item)
            plain_text += f"- {item_text}\n"

        if paused_licenses:
            plain_text += "\nThe following licenses have paused notifications:\n\n"
            for license_item in paused_licenses:
                item_text = self.format_license_text(license_item)
                paused_date_str = license_item.get("notifications_paused_date", datetime.now().strftime("%Y-%m-%d"))
                paused_date = datetime.strptime(paused_date_str, "%Y-%m-%d")
                enable_date = paused_date + timedelta(days=7)
                item_text += f" (Notifications will resume on {enable_date.strftime('%Y-%m-%d')})"
                plain_text += f"- {item_text}\n"

        plain_text += "\nPlease take the necessary actions to renew them.\n\n"
        plain_text += "Best regards,\nRemlic Support Team"

        return {'plain': plain_text, 'html': html_content}

    def format_license_text(self, license_item: Dict[str, Any]) -> str:
        """Format the license text for email content."""
        table = license_item.get('table', '')
        expiry_field = license_item.get('actual_expiry_field', 'expiry_date')
        expiry_date = license_item.get(expiry_field, 'N/A')
        
        if table == 'vehicles':
            item_text = f"Vehicle License: {license_item.get('make', '')} {license_item.get('model', '')} ({license_item.get('registration_number', '')}) expires on {expiry_date}"
        elif table == 'drivers':
            item_text = f"Driver License for {license_item.get('first_name', '')} {license_item.get('last_name', '')} expires on {expiry_date}"
        elif table == 'firearms':
            item_text = f"Firearm License: {license_item.get('make_model', '')} ({license_item.get('registration_number', '')}) expires on {expiry_date}"
        elif table == 'works':
            item_text = f"Work Contract: {license_item.get('contract_name', '')} with {license_item.get('company_name', '')} expires on {expiry_date}"
        elif table == 'passports':
            item_text = f"Passport: {license_item.get('first_name', '')} {license_item.get('last_name', '')} ({license_item.get('passport_number', '')}) expires on {expiry_date}"
        elif table == 'tv_licenses':
            item_text = f"TV License: {license_item.get('first_name', '')} {license_item.get('last_name', '')} ({license_item.get('license_number', '')}) expires on {expiry_date}"
        elif table == 'psira_records':
            item_text = f"PSIRA Record: {license_item.get('first_name', '')} {license_item.get('last_name', '')} ({license_item.get('psira_number', '')}) expires on {expiry_date}"
        elif table == 'competency':
            item_text = f"Competency Certificate: {license_item.get('first_name', '')} {license_item.get('last_name', '')} ({license_item.get('firearm_type', '')}) expires on {expiry_date}"
        else: # Handles other_documents
            item_text = f"{license_item.get('description', 'Unnamed Document')} expires on {expiry_date}"
        return item_text

    def get_last_reminder_date(self, user_id: str) -> Optional[datetime]:
        """Get the date of the last reminder sent to the user."""
        try:
            response = self.supabase.table("notifications") \
                .select("created_at") \
                .eq("user_id", user_id) \
                .like("message", "License expiring%") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            
            if not response.data or len(response.data) == 0:
                return None
                
            created_at = response.data[0].get("created_at")
            
            if isinstance(created_at, str):
                return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            return created_at
        except Exception as e:
            logger.error(f"Error retrieving last reminder date: {str(e)}")
            return None

    def should_send_reminder(self, 
                           expiry_date: datetime, 
                           last_reminder: Optional[datetime],
                           reminder_frequency: str,
                           reminder_days_before: int) -> bool:
        """Determine if a reminder should be sent based on user settings"""
        try:
            # Ensure reminder_days_before is a positive integer
            if not isinstance(reminder_days_before, int) or reminder_days_before <= 0:
                return False
            
            # Ensure expiry_date is a datetime object
            if not isinstance(expiry_date, datetime):
                logger.warning(f"Expiry date is not a datetime object: {expiry_date}")
                return False
            
            # Calculate the target reminder date
            target_reminder_date = expiry_date - timedelta(days=reminder_days_before)
            current_date = datetime.now().date()  # Use date only for comparison
            
            # Send if today is the target reminder date or between target and expiry
            if not (target_reminder_date.date() <= current_date <= expiry_date.date()):
                 return False
            
            # If no previous reminder, send immediately if within window
            if not last_reminder:
                return True
            
            # Calculate time since last reminder
            time_since_last = current_date - last_reminder.date()
            
            # Check frequency
            if reminder_frequency == 'daily':
                return time_since_last.days >= 1
            elif reminder_frequency == 'weekly':
                return time_since_last.days >= 7
            elif reminder_frequency == 'monthly':
                # Check if it's been at least 28 days (approx 1 month) to avoid sending too often
                return time_since_last.days >= 28 
            
            return False
        except Exception as e:
            logger.error(f"Reminder check error: {str(e)}")
            return False

    def process_user_notifications(self, user: Dict[str, Any], license_settings: List[Dict[str, Any]], all_license_data: List[List[Dict[str, Any]]]) -> None:
        """Process notifications for a single user based on their reminder settings."""
        user_id = user['id']
        user_email = user.get('email')
        all_expiring = []
        all_paused = []
        
        if not user_email:
            logger.error(f"No email found for user {user_id}")
            return
        
        # Get user's global settings (not used per type, but useful for defaults)
        global_reminder_days_before = 7 # Default global days
        global_reminder_frequency = "weekly" # Default global frequency
        
        # Process each license type fetched
        for license_type_data in all_license_data:
            if not license_type_data:
                continue
            
            # Get the table name from the first item
            table_name = license_type_data[0].get('table') if license_type_data else None
            if not table_name:
                continue
                
            # Find the corresponding settings for this license type (table name)
            type_settings = next((s for s in license_settings if s.get('type') == license_type_data[0].get('type_key')), None)
            
            # Use type-specific settings or fall back to defaults
            type_reminder_days = type_settings.get("reminder_days_before", global_reminder_days_before) if type_settings else global_reminder_days_before
            notifications_enabled_for_type = type_settings.get("notifications_enabled", False) if type_settings else False
            
            if not notifications_enabled_for_type:
                # logger.info(f"User {user_id}: Notifications disabled for type {table_name}")
                continue
            
            # Filter expiring licenses using type-specific settings
            expiring, paused = self.filter_expiring_licenses(license_type_data, type_reminder_days)
            
            all_expiring.extend(expiring)
            all_paused.extend(paused)
        
        # Send email if there are any expiring or paused licenses
        if all_expiring or all_paused:
            try:
                # Log what we're sending
                if all_expiring:
                    license_ids = [f"{item.get('table')}-{item.get('id')}" for item in all_expiring]
                    logger.info(f"User {user_id}: Preparing notification for {len(all_expiring)} expiring items: {license_ids}")
                
                # Get last reminder date for the user (any type)
                last_reminder_date = self.get_last_reminder_date(user_id)
                
                # Filter items that actually need a reminder based on frequency
                final_expiring_list = []
                for item in all_expiring:
                    expiry_field = item.get('actual_expiry_field', 'expiry_date')
                    expiry_date_str = item.get(expiry_field)
                    if not expiry_date_str: continue
                    
                    expiry_date_obj = None
                    if isinstance(expiry_date_str, str):
                        expiry_date_obj = datetime.strptime(expiry_date_str, "%Y-%m-%d")
                    elif isinstance(expiry_date_str, datetime):
                        expiry_date_obj = expiry_date_str
                    else:
                        continue
                        
                    type_settings = next((s for s in license_settings if s.get('type') == item.get('type_key')), None)
                    frequency = type_settings.get('reminder_frequency', global_reminder_frequency) if type_settings else global_reminder_frequency
                    days_before = type_settings.get('reminder_days_before', global_reminder_days_before) if type_settings else global_reminder_days_before
                    
                    if self.should_send_reminder(expiry_date_obj, last_reminder_date, frequency, days_before):
                        final_expiring_list.append(item)
                        
                # Only send if there are items in the final list after frequency check
                if final_expiring_list or all_paused:
                    logger.info(f"User {user_id}: Sending email for {len(final_expiring_list)} expiring and {len(all_paused)} paused items.")
                    email_body = self.build_email_body(user, final_expiring_list, all_paused)
                    email_result = self.send_email(user_email, "License Expiry Notification", email_body)
                    
                    if email_result["success"]:
                        for license_item in final_expiring_list:
                            expiry_field = license_item.get('actual_expiry_field', 'expiry_date')
                            expiry_date = license_item.get(expiry_field)
                            if isinstance(expiry_date, str):
                                expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                            elif isinstance(expiry_date, datetime):
                                expiry_date = expiry_date.date()
                                
                            days_until = (expiry_date - datetime.now().date()).days
                            message = f"Email sent: License expires in {days_until} days (on {expiry_date})"
                            self.create_notification(user_id, license_item, message)
                    else:
                        logger.error(f"Email delivery failed for user {user_id}: {email_result['error']}")
                        for license_item in final_expiring_list:
                            message = f"Failed to send email: {email_result['error']}"
                            self.create_notification(user_id, license_item, message)
            except Exception as e:
                logger.error(f"Email processing error for user {user_id}: {str(e)}")

    def send_reminders(self):
        """Main function to send reminders. Processes all users with active subscriptions."""
        try:
            # Get all users with active subscriptions
            response = self.supabase.table("profiles")\
                .select("*, license_type_settings(*)")\
                .eq("subscription_status", "active")\
                .execute()
                
            active_users = response.data or []
            logger.info(f"Processing reminders for {len(active_users)} active users")
            processed_count = 0
            
            for user in active_users:
                user_id = user['id']
                try:
                    # Extract license settings from the user profile data
                    license_settings = user.get('license_type_settings', [])
                    
                    # Fetch all license data for the user
                    _, *all_license_data = self.get_license_data(user_id)
                    
                    # Process notifications for this user
                    self.process_user_notifications(user, license_settings, all_license_data)
                    processed_count += 1
                except Exception as e:
                    logger.error(f"Error processing user {user_id}: {str(e)}")
            
            logger.info(f"Completed processing reminders: {processed_count} active users processed")
        except Exception as e:
            logger.error(f"Reminder processing error: {str(e)}")
            raise

def main() -> None:
    license_service = LicenseReminderService(supabase)
    try:
        logger.info("Starting reminder service...")
        license_service.send_reminders()
        logger.info("Reminder service finished successfully.")
    except Exception as e:
        logger.critical(f"Reminder service failed critically: {str(e)}")
        raise
    
if __name__ == "__main__":
    main()
