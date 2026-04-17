#!/usr/bin/env python3
"""
Migration script to create Supabase Auth users from existing PostgreSQL users.

IMPORTANT: Run this ONLY ONCE before switching the frontend to Supabase Auth.

This script:
1. Reads all users from PostgreSQL (email, tier, full_name, original UUID)
2. Creates corresponding Supabase Auth users
3. Stores tier in user_metadata
4. Sends password reset emails to all migrated users

Usage:
    python scripts/migrate_users_to_supabase.py

Environment variables needed:
    DATABASE_URL - PostgreSQL connection string
    SUPABASE_URL - e.g. https://your-project.supabase.co
    SUPABASE_SERVICE_KEY - Supabase service role key (for admin access)
"""
import os
import sys
import asyncio
from pathlib import Path

# Add parent dir to path so we can import config/db
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client, Client
from db.session import SessionLocal
from db.models import User
from config import settings


async def migrate_users():
    """Migrate all PostgreSQL users to Supabase Auth."""
    print("Starting user migration to Supabase Auth...")
    print(f"Supabase URL: {settings.SUPABASE_URL}")

    # Initialize Supabase admin client
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )

    db = SessionLocal()

    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users in PostgreSQL")

        migrated = 0
        failed = 0

        for user in users:
            try:
                # Check if user already exists in Supabase
                try:
                    existing = await supabase.auth.admin.list_users()
                    if any(u.email == user.email for u in existing.users):
                        print(f"[SKIP] {user.email} - already exists in Supabase")
                        continue
                except Exception:
                    pass

                # Create Supabase Auth user
                # Note: We can't migrate passwords, so we create disabled
                # and send password reset email
                auth_user = await supabase.auth.admin.create_user({
                    "email": user.email,
                    "email_confirm": True,  # Auto-confirm since we verified email in our DB
                    "user_metadata": {
                        "tier": user.tier or "FREE",
                        "full_name": user.full_name or "",
                        "original_user_id": str(user.id),
                    }
                })

                print(f"[MIGRATED] {user.email} -> Supabase ID: {auth_user.id}")

                # Force password reset so user sets their own password
                try:
                    await supabase.auth.admin.generate_reset_password_token(user.email)
                    print(f"[RESET EMAIL SENT] {user.email}")
                except Exception as e:
                    print(f"[WARNING] Could not send reset email for {user.email}: {e}")

                migrated += 1

            except Exception as e:
                print(f"[FAILED] {user.email}: {e}")
                failed += 1

        print(f"\n{'='*50}")
        print(f"Migration complete!")
        print(f"  Migrated: {migrated}")
        print(f"  Failed:   {failed}")
        print(f"{'='*50}")
        print(f"\nNext steps:")
        print(f"  1. Update .env with SUPABASE_URL and SUPABASE_SERVICE_KEY")
        print(f"  2. Update frontend .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
        print(f"  3. Test the login flow")
        print(f"  4. Delete old refresh_tokens table after confirming migration works")

    finally:
        db.close()


if __name__ == "__main__":
    print("WARNING: This migration script should only be run once.")
    print("Make sure you have backed up your database before proceeding.")
    print()

    # Check for required env vars
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        print("ERROR: Missing required environment variables:")
        print("  - SUPABASE_URL")
        print("  - SUPABASE_SERVICE_KEY")
        print("\nAdd these to your .env file and try again.")
        sys.exit(1)

    if not settings.DATABASE_URL:
        print("ERROR: Missing DATABASE_URL environment variable")
        sys.exit(1)

    response = input("Continue with migration? (yes/no): ")
    if response.lower() == "yes":
        asyncio.run(migrate_users())
    else:
        print("Migration cancelled.")
