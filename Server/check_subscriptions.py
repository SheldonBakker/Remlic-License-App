import os
from datetime import datetime, timezone, timedelta
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Connected to Supabase database successfully.")

def update_expired_subscriptions():
    """
    Check for expired subscriptions and update user status accordingly.
    Skip admin users when checking for expired subscriptions.
    """
    try:
        # Get all users with subscription end dates (regardless of current status)
        response = supabase.from_("profiles") \
            .select("*") \
            .filter("subscription_end_date", "not.is", "null") \
            .execute()

        # Use South African timezone (UTC+2)
        sa_timezone = timezone(timedelta(hours=2))
        current_time = datetime.now(sa_timezone)
        updated_count = 0

        for user in response.data:
            if not user.get('subscription_end_date'):
                continue

            # Convert subscription_end_date string to datetime
            end_date = datetime.fromisoformat(user['subscription_end_date'].replace('Z', '+00:00'))
            
            # Check if subscription has expired
            if current_time > end_date:
                print(f"Updating expired subscription for user {user['id']}")
                
                # Update user to registered type and expired status
                update_response = supabase.from_("profiles") \
                    .update({
                        "type_of_user": "registered",
                        "subscription_status": "expired",
                        "updated_at": current_time.isoformat()
                    }) \
                    .filter("id", "eq", user['id']) \
                    .execute()
                
                if update_response.data:
                    updated_count += 1
                    print(f"Successfully updated user {user['id']}")
                else:
                    print(f"Failed to update user {user['id']}")

        print(f"Updated {updated_count} expired subscriptions")
        return updated_count

    except Exception as e:
        print(f"Error updating expired subscriptions: {e}")
        return 0

def main():
    print("Starting subscription check...")
    updated_count = update_expired_subscriptions()
    print(f"Subscription check completed. Updated {updated_count} users.")

if __name__ == "__main__":
    main() 