import os
import sys
import logging
from datetime import datetime, timedelta
from typing import List

from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("manage_notify.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check for required environment variables
if not all([SUPABASE_URL, SUPABASE_KEY]):
    logger.critical("Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY")
    sys.exit(1)

class NotificationManager:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.tables = [
            "drivers",
            "firearms",
            "prpd",
            "vehicles",
            "works",
            "other_documents",
            "competency",
            "psira_records"
        ]

    def update_notification_status(self, table: str) -> None:
        """
        Update notification status for a specific table.
        """
        try:
            # Calculate the datetime 5 days ago
            five_days_ago = datetime.utcnow() - timedelta(days=5)

            # Get all records where notifications_paused is True
            response = (self.supabase.table(table)
                       .select("id, notifications_paused, updated_at")
                       .eq("notifications_paused", True)
                       .execute())

            for record in response.data:
                try:
                    updated_at_str = record.get('updated_at')
                    if updated_at_str is None:
                        logger.warning(f"No updated_at found for record {record.get('id')} in {table}")
                        continue

                    # Parse the updated_at timestamp
                    updated_at = datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    
                    if updated_at <= five_days_ago:
                        # Update the record to unpause notifications
                        update_response = (self.supabase.table(table)
                                         .update({
                                             "notifications_paused": False
                                         })
                                         .eq("id", record['id'])
                                         .execute())
                        
                        logger.info(f"Updated {table} record {record['id']}: notifications unpaused")
                except (ValueError, KeyError) as e:
                    logger.warning(f"Error processing record {record.get('id')} in {table}: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error updating {table}: {str(e)}")

    def process_all_tables(self) -> None:
        """
        Process all tables to update notification statuses.
        """
        for table in self.tables:
            logger.info(f"Processing table: {table}")
            self.update_notification_status(table)

def main() -> None:
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Connected to Supabase successfully")

        # Create notification manager and process tables
        notification_manager = NotificationManager(supabase)
        notification_manager.process_all_tables()
        
        logger.info("Notification management process completed successfully")

    except Exception as e:
        logger.error(f"Main process error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
